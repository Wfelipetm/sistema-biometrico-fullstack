# Importações de bibliotecas necessárias
from datetime import datetime, timedelta  # Manipulação de datas e horários
from flask import jsonify, request        # Utilidades Flask para requisição e resposta
from app.db.database import get_db_connection  # Função de conexão com o banco de dados
from app.services.biometric import IndexSearch, identify_user  # Lógica biométrica
import requests  # Para fazer chamadas HTTP ao backend em Node.js


# http://localhost:3001

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
    cursor.execute("SELECT id_biometrico, id FROM funcionarios")
    for row in cursor.fetchall():
        IndexSearch.AddFIR(row[0], int(row[1]))  # Adiciona cada funcionário à base de identificação
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

    funcionario_id = IndexSearch.UserID  # ID do funcionário identificado

    # ===========================
    # 3. Buscar dados do funcionário no banco
    # ===========================
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, nome, cpf, unidade_id, matricula, cargo, id_biometrico, email
        FROM funcionarios WHERE id = %s
    """, (funcionario_id,))
    user_data = cursor.fetchone()
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
    # 6. Busca escala do funcionário e verifica registros considerando a escala
    # ===========================
    cursor.execute("SELECT tipo_escala FROM funcionarios WHERE id = %s", (funcionario_id,))
    escala_result = cursor.fetchone()
    escala = escala_result[0] if escala_result else '8h'
    
    # Para escalas de 24h, verifica registros dos últimos 2 dias
    # Para outras escalas, verifica apenas o dia atual
    if escala in ['24h', '24x72']:
        cursor.execute("""
            SELECT id, hora_entrada, hora_saida, data_hora FROM registros_ponto 
            WHERE funcionario_id = %s 
            AND DATE(data_hora) >= %s - INTERVAL '1 day'
            AND DATE(data_hora) <= %s
            AND hora_saida IS NULL
            ORDER BY data_hora DESC LIMIT 1
        """, (funcionario_id, data_atual, data_atual))
        ultimo_ponto_pendente = cursor.fetchone()
        
        # Também verifica se já tem registro completo no dia atual
        cursor.execute("""
            SELECT id, hora_entrada, hora_saida, data_hora FROM registros_ponto 
            WHERE funcionario_id = %s 
            AND DATE(data_hora) = %s 
            ORDER BY data_hora DESC LIMIT 1
        """, (funcionario_id, data_atual))
        ultimo_ponto_hoje = cursor.fetchone()
    else:
        # Para escalas normais, mantém a lógica atual
        cursor.execute("""
            SELECT id, hora_entrada, hora_saida, data_hora FROM registros_ponto 
            WHERE funcionario_id = %s 
            AND DATE(data_hora) = %s 
            ORDER BY data_hora DESC LIMIT 1
        """, (funcionario_id, data_atual))
        ultimo_ponto_hoje = cursor.fetchone()
        ultimo_ponto_pendente = ultimo_ponto_hoje if ultimo_ponto_hoje and ultimo_ponto_hoje[2] is None else None

    mensagem = ""

    # ===========================
    # 7. REGISTRO DE ENTRADA
    # ===========================
    # Se não há ponto pendente E não há registro completo hoje
    if not ultimo_ponto_pendente and (not ultimo_ponto_hoje or ultimo_ponto_hoje[2] is None):
        # Não há registro pendente, registra entrada
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
                "http://biometrico.itaguai.rj.gov.br:3001/reg/calcular-registro-ponto",
                json=payload,
                timeout=10
            )
            response.raise_for_status()
        except requests.RequestException as e:
            # Se o Node.js retornou erro, tente pegar a mensagem do corpo da resposta
            if e.response is not None and e.response.content:
                try:
                    error_json = e.response.json()
                    return jsonify(error_json), e.response.status_code
                except Exception:
                    # Se não for JSON, retorna texto puro
                    return jsonify({"message": e.response.text}), e.response.status_code
            # Se não tem resposta do Node, retorna erro genérico
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
    elif ultimo_ponto_pendente and ultimo_ponto_pendente[2] is None:
        # Há entrada sem saída (pode ser de ontem para escalas 24h), registra saída
        hora_entrada_time = ultimo_ponto_pendente[1]
        data_entrada = datetime.combine(ultimo_ponto_pendente[3].date(), hora_entrada_time)
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
            "data": ultimo_ponto_pendente[3].date().strftime("%Y-%m-%d"),  # Usa a data da entrada
            "hora_entrada": hora_entrada_time.strftime("%H:%M:%S"),
            "hora_saida": hora_saida,
            "id_biometrico": id_biometrico
        }
        try:
            response = requests.post(
                "http://biometrico.itaguai.rj.gov.br:3001/reg/calcular-registro-ponto",
                json=payload,
                timeout=10
            )
            response.raise_for_status()
        except requests.RequestException as e:
            # Se o Node.js retornou erro, tente pegar a mensagem do corpo da resposta
            if e.response is not None and e.response.content:
                try:
                    error_json = e.response.json()
                    return jsonify(error_json), e.response.status_code
                except Exception:
                    # Se não for JSON, retorna texto puro
                    return jsonify({"message": e.response.text}), e.response.status_code
            # Se não tem resposta do Node, retorna erro genérico
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
    # 9. Caso já tenha registro completo hoje
    # ===========================
    elif ultimo_ponto_hoje and ultimo_ponto_hoje[1] is not None and ultimo_ponto_hoje[2] is not None:
        # Já tem entrada e saída hoje
        return jsonify({
            "message": f"Você já bateu sua saída hoje ({data_atual.strftime('%d/%m/%Y')})."
        }), 400

    # ===========================
    # 10. Caso inesperado
    # ===========================
    else:
        return jsonify({
            "message": "Estado do registro de ponto não identificado. Contate o suporte."
        }), 500

    # Finaliza conexões com banco
    cursor.close()
    conn.close()

    # Determina o tipo baseado na condição que foi executada
    tipo_registro = "entrada" if not ultimo_ponto_pendente and (not ultimo_ponto_hoje or ultimo_ponto_hoje[2] is None) else "saida"

    # Resposta de sucesso com detalhes do registro
    return jsonify({
        "message": mensagem,
        "funcionario": user_name,
        "matricula": matricula,
        "data_hora": f"{data_registro} {hora_entrada}",
        "tipo": tipo_registro
    }), 200
