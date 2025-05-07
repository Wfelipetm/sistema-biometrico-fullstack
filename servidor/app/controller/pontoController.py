from datetime import datetime
from flask import jsonify
from app.db.database import get_db_connection
from app.services.biometric import IndexSearch, identify_user
import requests

# Função para enviar e-mail via backend Node.js
def send_email(subject, recipient, body):
    try:
        response = requests.post("http://biometrico.itaguai.rj.gov.br:3001/api/enviar-email", json={
            "subject": subject,
            "recipient": recipient,
            "body": body
        })
        response.raise_for_status()
        print(f"✅ E-mail enviado para {recipient}")
    except requests.RequestException as e:
        print(f"❌ Erro ao enviar e-mail: {e}")

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

        cursor.execute("""
            SELECT data_inicio, data_fim FROM ferias 
            WHERE funcionario_id = %s AND data_inicio <= %s AND data_fim >= %s
        """, (funcionario_id, data_atual, data_atual))
        ferias_data = cursor.fetchone()

        if ferias_data:
            return jsonify({"message": "Funcionario de férias, você não pode registrar o ponto!"}), 400

        cursor.execute("""
            SELECT id, hora_entrada, hora_saida FROM registros_ponto 
            WHERE funcionario_id = %s AND DATE(data_hora) = %s 
            ORDER BY data_hora DESC LIMIT 1
        """, (funcionario_id, data_atual))
        ultimo_ponto = cursor.fetchone()

        data_hora = datetime.now()
        hora_entrada = None
        hora_saida = None

        if not ultimo_ponto:
            hora_entrada = data_hora.strftime("%H:%M:%S")
            cursor.execute("""
                INSERT INTO registros_ponto (funcionario_id, unidade_id, data_hora, hora_entrada, hora_saida, id_biometrico)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (funcionario_id, unidade_id, data_hora, hora_entrada, hora_saida, id_biometrico))

            send_email(
                subject="Registro de Entrada - Ponto Registrado",
                recipient=email,
                body=f"""
                <html>
                    <body style="font-family: Arial, sans-serif; color: #333;">
                        <p>Olá <strong>{user_name}</strong>,</p><br><br>
                        <p>Você está recebendo o comprovante de registro de ponto conforme informações a seguir.</p>
                        <p><strong>✅ Registro de entrada efetuado.</strong></p>
                        <p><strong>👤 Profissional:</strong> {user_name}<br><br>
                        <strong>📅 Data/Hora:</strong> {data_hora.strftime('%d/%m/%Y %H:%M:%S')}</p><br><br>
                        <p>Atenciosamente,<br><strong>Prefeitura de Itaguaí</strong></p>
                    </body>
                </html>
                """
            )

        elif ultimo_ponto[1] is not None and ultimo_ponto[2] is None:
            hora_saida = data_hora.strftime("%H:%M:%S")
            cursor.execute("""
                UPDATE registros_ponto
                SET hora_saida = %s
                WHERE id = %s
            """, (hora_saida, ultimo_ponto[0]))

            send_email(
                subject="Registro de Saída - Ponto Registrado",
                recipient=email,
                body=f"""
                <html>
                    <body style="font-family: Arial, sans-serif; color: #333;">
                        <p>Olá <strong>{user_name}</strong>,</p><br><br>
                        <p>Você está recebendo o comprovante de registro de ponto conforme informações a seguir.</p>
                        <p><strong>✅ Registro de saída efetuado.</strong></p>
                        <p><strong>👤 Profissional:</strong> {user_name}<br><br>
                        <strong>📅 Data/Hora:</strong> {data_hora.strftime('%d/%m/%Y %H:%M:%S')}</p><br><br>
                        <p>Atenciosamente,<br><strong>Prefeitura de Itaguaí</strong></p>
                    </body>
                </html>
                """
            )

        else:
            return jsonify({"message": f"Você já bateu seu ponto de saída hoje ({data_atual.strftime('%d/%m/%Y')})."}), 400

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "message": f"User identified: {user_name} (ID: {id_biometrico})",
            "cpf": cpf,
            "cargo": cargo,
            "unidade_id": unidade_id,
            "matricula": matricula,
            "registro_ponto": {
                "data_hora": data_hora.strftime("%d/%m/%Y %H:%M:%S"),
                "hora_entrada": hora_entrada,
                "hora_saida": hora_saida,
                "id_biometrico": id_biometrico
            }
        }), 200

    else:
        return jsonify({"message": "Usuário não identificado"}), 404
