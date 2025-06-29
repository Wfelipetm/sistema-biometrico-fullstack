from datetime import datetime
from flask import jsonify
from app.db.database import get_db_connection
from app.services.biometric import IndexSearch, identify_user
import requests
import json


# http://biometrico.itaguai.rj.gov.br:3001
# http://localhost:3001


#http://localhost:3001
#http://biometrico.itaguai.rj.gov.br:3001
def send_email(subject, recipient, body):
    try:
        response = requests.post("http://biometrico.itaguai.rj.gov.br:3001/api/enviar-email", json={
            "subject": subject,
            "recipient": recipient,
            "body": body
        })
        response.raise_for_status()
        print(f"E-mail enviado para {recipient}")
    except requests.RequestException as e:
        print(f"Erro ao enviar e-mail: {e}")

def register_ponto():
    IndexSearch.ClearDB()

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id_biometrico, id FROM funcionarios")
    for row in cursor.fetchall():
        IndexSearch.AddFIR(row[0], int(row[1]))

    conn.close()

    fir_data = identify_user()

    if not fir_data:
        return jsonify({"message": "Nenhuma impressão digital capturada. Por favor, tente novamente."}), 400

    IndexSearch.IdentifyUser(fir_data, 5)

    if IndexSearch.UserID != 0:
        id_biometrico = IndexSearch.UserID
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, nome, cpf, unidade_id, matricula, cargo, id_biometrico, email
            FROM funcionarios WHERE id = %s
        """, (id_biometrico,))
        user_data = cursor.fetchone()

        if not user_data:
            return jsonify({"message": "Usuário não encontrado no banco de dados."}), 404

        funcionario_id, user_name, cpf, unidade_id, matricula, cargo, id_biometrico, email = user_data
        data_atual = datetime.now().date()

        # Buscando o nome da unidade
        cursor.execute("SELECT nome FROM unidades WHERE id = %s", (unidade_id,))
        unidade_row = cursor.fetchone()
        unidade_nome = unidade_row[0] if unidade_row else "Unidade Desconhecida"

        # Verifica se está de férias
        cursor.execute("""
            SELECT data_inicio, data_fim FROM ferias 
            WHERE funcionario_id = %s AND data_inicio <= %s AND data_fim >= %s
        """, (funcionario_id, data_atual, data_atual))
        ferias_data = cursor.fetchone()

        if ferias_data:
            return jsonify({"message": "Funcionario de férias, você não pode registrar o ponto!"}), 400

        # Último ponto do dia ---------------------------------------------------------
        cursor.execute("""
            SELECT id, hora_entrada, hora_saida, data_hora FROM registros_ponto 
            WHERE funcionario_id = %s AND hora_saida IS NULL
            ORDER BY data_hora DESC LIMIT 1
        """, (funcionario_id,))

           # Último ponto do dia ---------------------------------------------------------
        ultimo_ponto = cursor.fetchone()

        data_hora = datetime.now()
        mensagem = ""

        if not ultimo_ponto:
            # Registro de entrada
            hora_entrada = data_hora.strftime("%H:%M:%S")
            payload = {
                "funcionario_id": funcionario_id,
                "unidade_id": unidade_id,
                "data": data_atual.strftime("%Y-%m-%d"),
                "hora_entrada": hora_entrada,
                "hora_saida": None,
                "id_biometrico": id_biometrico
            }
            # print("Payload enviado para Node.js:")
            # print(json.dumps(payload, indent=2))
            try:
                response = requests.post(
                    "http://biometrico.itaguai.rj.gov.br:3001/reg/calcular-registro-ponto",
                    json=payload,
                    timeout=10
                )
                print("Status code Node.js:", response.status_code)
                print("Resposta Node.js:", response.text)
                response.raise_for_status()
            except requests.RequestException as e:
                print("Erro ao registrar ponto no backend Node.js:", str(e))
                # Tenta extrair a mensagem do Node.js se houver resposta
                try:
                    error_message = response.json().get("error") if response is not None else None
                except Exception:
                    error_message = None
                return jsonify({
                    "message": error_message or
                    "Não foi possível registrar seu ponto neste momento devido a uma instabilidade no sistema. "
                    "Por favor, tente novamente em alguns minutos ou procure o RH para suporte."
                }), 500

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

        elif ultimo_ponto[1] is not None and ultimo_ponto[2] is None:
            # Registro de saída
            hora_entrada_time = ultimo_ponto[1]
            data_entrada = datetime.combine(ultimo_ponto[3].date(), hora_entrada_time)

            hora_saida = datetime.now().strftime("%H:%M:%S")
            payload = {
                "funcionario_id": funcionario_id,
                "unidade_id": unidade_id,
                "data": data_atual.strftime("%Y-%m-%d"),
                "hora_entrada": hora_entrada_time.strftime("%H:%M:%S"),
                "hora_saida": hora_saida,
                "id_biometrico": id_biometrico
            }
            try:
                response = requests.post("http://biometrico.itaguai.rj.gov.br:3001/reg/calcular-registro-ponto", json=payload, timeout=10)
                response.raise_for_status()
            except requests.RequestException as e:
                print('[ERRO] Falha ao criar registro de ponto:', e)
                return jsonify({"error": "Erro ao registrar ponto. Contate o suporte."}), 500

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
        else:
            return jsonify({"message": f"Você já bateu seu ponto de saída hoje ({data_atual.strftime('%d/%m/%Y')})."}), 400

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "message": mensagem,
            "cpf": cpf,
            "cargo": cargo,
            "unidade_id": unidade_id,
            "matricula": matricula
        }), 200

    return jsonify({"message": "Usuário não identificado. Tente novamente."}), 401