# Importações de bibliotecas necessárias
from datetime import datetime, timedelta  # Manipulação de datas e horários
from flask import jsonify, request        # Utilidades Flask para requisição e resposta
from app.db.database import get_db_connection  # Função de conexão com o banco de dados
from app.services.biometric import IndexSearch, identify_user  # Lógica biométrica
import requests  # Para fazer chamadas HTTP ao backend em Node.js


# http://biometrico.itaguai.rj.gov.br:3001

# ===========================
# Função auxiliar para envio de e-mail
# ===========================
def send_email(subject, recipient, body):
    try:
        # Envia um POST com os dados do e-mail para o backend Node.js
        response = requests.post("http://biometrico.itaguai.rj.gov.br:3001/api/enviar-email", json={
            "subject": subject,
            "recipient": recipient,
            "body": body
        })
        response.raise_for_status()  # Lança exceção se o status não for 2xx
        print(f"E-mail enviado para {recipient}")
    except requests.RequestException as e:
        print(f"Erro ao enviar e-mail: {e}")

# ===========================
# Função principal: Registrar ponto via biometria
# ===========================
def register_ponto():
    data = request.json or {}  # Lê os dados enviados no corpo da requisição

    # Captura os parâmetros principais enviados pelo terminal
    unidade_id_terminal = data.get('unidade_id')
    data_registro = data.get('data') or datetime.now().date().strftime("%Y-%m-%d")
    hora_entrada = data.get('hora_entrada') or datetime.now().strftime("%H:%M:%S")

    # ===========================
    # 1. Preparação para identificação biométrica
    # ===========================
    IndexSearch.ClearDB()  # Limpa base de digitais temporária
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Adiciona funcionários principais
    cursor.execute("SELECT id_biometrico, id FROM funcionarios")
    for row in cursor.fetchall():
        IndexSearch.AddFIR(row[0], int(row[1]))  # Adiciona cada funcionário à base de identificação
    
    # Adiciona vínculos adicionais com offset de 1000000
    VINCULO_OFFSET = 1000000
    cursor.execute("SELECT id_biometrico, id FROM funcionarios_unidades_adicionais WHERE status = 1")
    vinculos = cursor.fetchall()
    for row in vinculos:
        vinculo_user_id = VINCULO_OFFSET + int(row[1])
        IndexSearch.AddFIR(row[0], vinculo_user_id)
    
    conn.close()

    # ===========================
    # 2. Captura da digital no leitor e identificação
    # ===========================
    fir_data = identify_user()
    if not fir_data:
        return jsonify({"message": "Nenhuma impressão digital capturada. Por favor, tente novamente."}), 400

    IndexSearch.IdentifyUser(fir_data, 5)  # Tenta identificar com tolerância 5
    if IndexSearch.UserID == 0:
        return jsonify({"message": "Usuário não identificado. Digital não cadastrada no sistema."}), 401

    id_identificado = IndexSearch.UserID  # ID identificado (pode ser funcionário ou vínculo)

    # ===========================
    # 3. Buscar dados do funcionário no banco (Principal ou Vínculo)
    # ===========================
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verifica se é um vínculo adicional
    if id_identificado >= VINCULO_OFFSET:
        # É um vínculo adicional
        vinculo_id = id_identificado - VINCULO_OFFSET
        cursor.execute("""
            SELECT fua.funcionario_id, f.nome, f.cpf, fua.unidade_id, fua.matricula, 
                   fua.cargo, fua.id_biometrico, f.email
            FROM funcionarios_unidades_adicionais fua
            INNER JOIN funcionarios f ON fua.funcionario_id = f.id
            WHERE fua.id = %s AND fua.status = 1
        """, (vinculo_id,))
        user_data = cursor.fetchone()
        tipo_registro = "vinculo_adicional"
    else:
        # É um funcionário principal
        cursor.execute("""
            SELECT id, nome, cpf, unidade_id, matricula, cargo, id_biometrico, email
            FROM funcionarios WHERE id = %s
        """, (id_identificado,))
        user_data = cursor.fetchone()
        tipo_registro = "funcionario_principal"
    
    if not user_data:
        return jsonify({"message": "Funcionário não encontrado no banco de dados."}), 404

    # Atribui as informações do funcionário a variáveis
    funcionario_id, user_name, cpf, unidade_id_funcionario, matricula, cargo, id_biometrico, email = user_data

    # ===========================
    # 4. Validação de unidade (terminal vs funcionário)
    # ===========================
    if not unidade_id_terminal:
        return jsonify({"message": "unidade_id é obrigatório"}), 400

    if unidade_id_funcionario != unidade_id_terminal:
        # Busca nomes das unidades para detalhar o erro
        cursor.execute("SELECT nome FROM unidades WHERE id = %s", (unidade_id_funcionario,))
        unidade_funcionario_nome = cursor.fetchone()
        cursor.execute("SELECT nome FROM unidades WHERE id = %s", (unidade_id_terminal,))
        unidade_terminal_nome = cursor.fetchone()

        print(f"[ACESSO NEGADO] Funcionário: {user_name} (ID: {funcionario_id}) | Unidade do funcionário: {unidade_funcionario_nome[0] if unidade_funcionario_nome else unidade_id_funcionario} | Unidade do terminal: {unidade_terminal_nome[0] if unidade_terminal_nome else unidade_id_terminal} | Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")

        return jsonify({
            "message": "Funcionário não pertence a esta unidade.",
            "funcionario": user_name,
            "unidade_funcionario": unidade_funcionario_nome[0] if unidade_funcionario_nome else unidade_id_funcionario,
            "unidade_terminal": unidade_terminal_nome[0] if unidade_terminal_nome else unidade_id_terminal
        }), 403

    # ===========================
    # 5. Verifica se o funcionário está de férias
    # ===========================
    data_atual = datetime.strptime(data_registro, "%Y-%m-%d").date()
    cursor.execute("""
        SELECT data_inicio, data_fim FROM ferias 
        WHERE funcionario_id = %s AND data_inicio <= %s AND data_fim >= %s
    """, (funcionario_id, data_atual, data_atual))
    ferias_data = cursor.fetchone()
    if ferias_data:
        return jsonify({"message": "Funcionário de férias, você não pode registrar o ponto!"}), 400

    # ===========================
    # 6. Verifica se já existe ponto de entrada sem saída
    # ===========================
    cursor.execute("""
        SELECT id, hora_entrada, hora_saida, data_hora FROM registros_ponto 
        WHERE funcionario_id = %s AND hora_saida IS NULL
        ORDER BY data_hora DESC LIMIT 1
    """, (funcionario_id,))
    ultimo_ponto = cursor.fetchone()

    mensagem = ""

    # ===========================
    # 7. REGISTRO DE ENTRADA
    # ===========================
    if not ultimo_ponto:
        payload = {
            "funcionario_id": funcionario_id,
            "unidade_id": unidade_id_terminal,
            "data": data_registro,
            "hora_entrada": hora_entrada,
            "hora_saida": None,
            "id_biometrico": id_biometrico
        }
        try:
            response = requests.post(
                "http://biometrico.itaguai.rj.gov.br:3001/reg/calcular-registro-ponto-assistencia",
                json=payload,
                timeout=10
            )
            response.raise_for_status()
        except requests.RequestException as e:
            # Repasse a mensagem do Node.js se houver
            if e.response is not None and e.response.content:
                try:
                    error_json = e.response.json()
                    return jsonify(error_json), e.response.status_code
                except Exception:
                    return jsonify({"message": e.response.text}), e.response.status_code
            return jsonify({"message": "Erro ao registrar ponto no sistema"}), 500

        # Envia e-mail de comprovante de entrada
        data_hora = datetime.now()
        mensagem = (
            f"Registro de entrada realizado com sucesso para funcionario: {user_name}\n"
            f"Comprovante enviado para o e-mail {email}"
        )
        send_email(
            subject="Registro de Entrada - Ponto Registrado",
            recipient=email,
            body=f"""
                Prezado(a) {user_name},

                Este e-mail confirma o registro de seu ponto conforme as informações abaixo:

                Entrada registrada com sucesso.

                Profissional: {user_name}
                Data/Hora: {data_hora.strftime('%d/%m/%Y %H:%M:%S')}

                Se precisar de suporte ou tiver dúvidas, entre em contato com a Prefeitura de Itaguaí.

                Atenciosamente,
                Prefeitura de Itaguaí
            """
        )
        print(f"[ENTRADA REGISTRADA] Funcionário: {user_name} (ID: {funcionario_id}) | Unidade: {unidade_id_terminal} | Data/Hora: {data_registro} {hora_entrada}")

    # ===========================
    # 8. REGISTRO DE SAÍDA (com bloqueio de 5 minutos)
    # ===========================
    elif ultimo_ponto[1] is not None and ultimo_ponto[2] is None:
        hora_entrada_time = ultimo_ponto[1]
        data_entrada = datetime.combine(ultimo_ponto[3].date(), hora_entrada_time)
        tempo_decorrido = datetime.now() - data_entrada
        tempo_decorrido_minutos = tempo_decorrido.total_seconds() / 60

        if tempo_decorrido_minutos < 1:
            tempo_restante = int(1 - tempo_decorrido_minutos) + 1
            print(f"[TENTATIVA BLOQUEADA] Funcionário: {user_name} (ID: {funcionario_id}) | Tempo decorrido: {tempo_decorrido_minutos:.2f} minutos | Tempo restante: {tempo_restante} minuto(s)")
            return jsonify({
                "message": f"Você deve aguardar pelo menos 5 minutos após a entrada para registrar a saída. Tempo restante: {tempo_restante} minuto(s)."
            }), 400

        # Se passou mais de 5 minutos, registra a saída
        hora_saida = datetime.now().strftime("%H:%M:%S")
        payload = {
            "funcionario_id": funcionario_id,
            "unidade_id": unidade_id_terminal,
            "data": data_registro,
            "hora_entrada": hora_entrada_time.strftime("%H:%M:%S"),
            "hora_saida": hora_saida,
            "id_biometrico": id_biometrico
        }
        try:
            response = requests.post(
                "http://biometrico.itaguai.rj.gov.br:3001/reg/calcular-registro-ponto-assistencia",
                json=payload,
                timeout=10
            )
            response.raise_for_status()
        except requests.RequestException as e:
            # Repasse a mensagem do Node.js se houver
            if e.response is not None and e.response.content:
                try:
                    error_json = e.response.json()
                    return jsonify(error_json), e.response.status_code
                except Exception:
                    return jsonify({"message": e.response.text}), e.response.status_code
            return jsonify({"message": "Erro ao registrar ponto no sistema"}), 500

        # Envia e-mail de comprovante de saída
        mensagem = (
            f"Registro de saida realizado com sucesso para funcionario: {user_name}\n"
            f"Comprovante enviado para o e-mail {email}"
        )
        send_email(
            subject="Registro de Saída - Ponto Registrado",
            recipient=email,
            body=f"""
                Prezado(a) {user_name},

                Este e-mail confirma o registro de sua saída conforme as informações abaixo:

                Saída registrada com sucesso.

                Profissional: {user_name}
                Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}

                Se precisar de suporte ou tiver dúvidas, entre em contato com a Prefeitura de Itaguaí.

                Atenciosamente,
                Prefeitura de Itaguaí
            """
        )
        print(f"[SAÍDA REGISTRADA] Funcionário: {user_name} (ID: {funcionario_id}) | Unidade: {unidade_id_terminal} | Tempo trabalhado: {tempo_decorrido_minutos:.2f} minutos")

    # ===========================
    # 9. Caso já tenha registro de saída
    # ===========================
    else:
        return jsonify({"message": f"Você já bateu seu ponto de saída hoje ({data_atual.strftime('%d/%m/%Y')})."}), 400

    # Finaliza conexões com banco
    cursor.close()
    conn.close()

    # Resposta de sucesso com detalhes do registro
    return jsonify({
        "message": mensagem,
        "funcionario": user_name,
        "matricula": matricula,
        "cargo": cargo,
        "unidade_id": unidade_id_funcionario,
        "data_hora": f"{data_registro} {hora_entrada}",
        "tipo_ponto": "entrada" if not ultimo_ponto else "saida",
        "tipo_vinculo": tipo_registro
    }), 200
