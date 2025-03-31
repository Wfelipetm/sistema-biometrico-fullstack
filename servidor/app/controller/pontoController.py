from flask import jsonify
from app.db.database import get_db_connection
from datetime import datetime
from app.services.biometric import IndexSearch, identify_user
from flask_mail import Message
from app import mail  


# Função para enviar e-mail
def send_email(subject, recipient, body):
    msg = Message(subject=subject, recipients=[recipient], html=body)
    try:
        mail.send(msg)
        print(f"E-mail enviado para {recipient} com o assunto: {subject}")
    except Exception as e:
        print(f"Erro ao enviar e-mail: {e}")


def register_ponto():
    # Limpa o banco de dados de indexação
    IndexSearch.ClearDB()

    # Conectar ao banco de dados
    conn = get_db_connection()
    cursor = conn.cursor()

    # Buscar todos os usuários no banco de dados e adicionar FIR à indexação
    cursor.execute("SELECT id_biometrico, id FROM funcionarios")
    for row in cursor.fetchall():
        IndexSearch.AddFIR(row[0], int(row[1]))

    conn.close()

    fir_data = identify_user()

    if not fir_data:  
        return jsonify({"message": "Nenhuma impressão digital capturada. Por favor, tente novamente."}), 400

    # Identificação do usuário
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

        funcionario_id = user_data[0]
        user_name = user_data[1]
        cpf = user_data[2]
        unidade_id = user_data[3]
        matricula = user_data[4]
        cargo = user_data[5]
        id_biometrico = user_data[6]
        email = user_data[7]  
        data_atual = datetime.now().date()

        # Verificar se já há um registro de ponto no mesmo dia
        cursor.execute("""
            SELECT id, hora_entrada, hora_saida FROM registros_ponto 
            WHERE funcionario_id = %s AND DATE(data_hora) = %s 
            ORDER BY data_hora DESC LIMIT 1
        """, (funcionario_id, data_atual))
        ultimo_ponto = cursor.fetchone()

        data_hora = datetime.now()
        hora_entrada = None
        hora_saida = None

        if not ultimo_ponto:  # Se não há registro no dia, cria um novo com hora de entrada
            hora_entrada = data_hora.strftime("%H:%M:%S")
            cursor.execute("""
                INSERT INTO registros_ponto (funcionario_id, unidade_id, data_hora, hora_entrada, hora_saida, id_biometrico)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (funcionario_id, unidade_id, data_hora, hora_entrada, hora_saida, id_biometrico))

            # Enviar e-mail de entrada
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

        elif ultimo_ponto[1] is not None and ultimo_ponto[2] is None:  # Se já tem entrada e ainda não tem saída, registra saída
            hora_saida = data_hora.strftime("%H:%M:%S")
            cursor.execute(
                """
                UPDATE registros_ponto
                SET hora_saida = %s
                WHERE id = %s
                """,
                (hora_saida, ultimo_ponto[0])
            )

            # Enviar e-mail de saída
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

        else:  # Se já tem saída registrada para o dia, não permite um novo registro
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
