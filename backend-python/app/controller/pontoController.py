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

        # 🆕 Busca dados do funcionário incluindo tipo_escala
        cursor.execute("""
            SELECT id, nome, cpf, unidade_id, matricula, cargo, id_biometrico, email, tipo_escala
            FROM funcionarios WHERE id = %s
        """, (id_biometrico,))
        user_data = cursor.fetchone()

        if not user_data:
            return jsonify({"message": "Usuário não encontrado no banco de dados."}), 404

        funcionario_id, user_name, cpf, unidade_id, matricula, cargo, id_biometrico_db, email, tipo_escala = user_data
        data_atual = datetime.now().date()

        # 🆕 Determina se é escala especial
        is_escala_especial = tipo_escala in ['12x36', '24x72'] if tipo_escala else False

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

        data_hora = datetime.now()
        mensagem = ""

        # ========================================
        # 🔥 NOVA LÓGICA PARA ESCALAS ESPECIAIS
        # ========================================
        if is_escala_especial:
            print(f"[DEBUG] Funcionário {user_name} tem escala especial: {tipo_escala}")
            
            # Verifica se existe entrada em aberto (últimos 3 dias)
            cursor.execute("""
                SELECT id, data_entrada, hora_entrada, created_at
                FROM registros_ponto 
                WHERE funcionario_id = %s 
                  AND hora_entrada IS NOT NULL 
                  AND hora_saida IS NULL
                  AND created_at >= %s
                ORDER BY created_at DESC 
                LIMIT 1
            """, (funcionario_id, data_atual - datetime.timedelta(days=3)))
            entrada_aberta = cursor.fetchone()

            if not entrada_aberta:
                # 📥 REGISTRAR ENTRADA (escala especial)
                print(f"[DEBUG] Registrando ENTRADA para escala especial")
                
                hora_entrada = data_hora.strftime("%H:%M:%S")
                cursor.execute("""
                    INSERT INTO registros_ponto (
                        funcionario_id, unidade_id, data_hora, 
                        data_entrada, hora_entrada, 
                        data_saida, hora_saida, 
                        id_biometrico
                    ) VALUES (%s, %s, %s, %s, %s, NULL, NULL, %s)
                """, (funcionario_id, unidade_id, data_hora, data_atual, hora_entrada, id_biometrico))

                mensagem = (
                    f"Registro de ENTRADA realizado com sucesso na unidade: {unidade_nome}\n"
                    f"Escala: {tipo_escala}\n"
                    f"Comprovante enviado para o e-mail {email}"
                )

                send_email(
                    subject="Registro de Entrada - Ponto Registrado (Escala Especial)",
                    recipient=email,
                    body=f"""
                    Prezado(a) {user_name},

                    Este e-mail confirma o registro de sua ENTRADA conforme as informações abaixo:

                    Entrada registrada com sucesso (Escala {tipo_escala}).

                    Profissional: {user_name}
                    Data/Hora: {data_hora.strftime('%d/%m/%Y %H:%M:%S')}
                    Unidade: {unidade_nome}

                    IMPORTANTE: Para escalas especiais, registre a saída quando finalizar seu turno.

                    Se precisar de suporte ou tiver dúvidas, entre em contato com a Prefeitura de Itaguaí.

                    Atenciosamente,
                    Prefeitura de Itaguaí
                    """
                )

            else:
                # 📤 REGISTRAR SAÍDA (escala especial)
                print(f"[DEBUG] Registrando SAÍDA para escala especial")
                
                # Validação: saída deve ser posterior à entrada
                entrada_datetime = datetime.combine(entrada_aberta[1], entrada_aberta[2])
                if data_hora <= entrada_datetime:
                    return jsonify({
                        "message": f"Erro: A saída deve ser posterior à entrada ({entrada_aberta[1]} {entrada_aberta[2]})"
                    }), 400

                hora_saida = data_hora.strftime("%H:%M:%S")
                
                # Cria NOVO registro para a saída
                cursor.execute("""
                    INSERT INTO registros_ponto (
                        funcionario_id, unidade_id, data_hora, 
                        data_entrada, hora_entrada, 
                        data_saida, hora_saida, 
                        id_biometrico
                    ) VALUES (%s, %s, %s, NULL, NULL, %s, %s, %s)
                """, (funcionario_id, unidade_id, data_hora, data_atual, hora_saida, id_biometrico))

                # Calcula duração do turno
                duracao = data_hora - entrada_datetime
                horas = int(duracao.total_seconds() // 3600)
                minutos = int((duracao.total_seconds() % 3600) // 60)

                mensagem = (
                    f"Registro de SAÍDA realizado com sucesso na unidade: {unidade_nome}\n"
                    f"Escala: {tipo_escala}\n"
                    f"Duração do turno: {horas}h {minutos}min\n"
                    f"Comprovante enviado para o e-mail {email}"
                )

                send_email(
                    subject="Registro de Saída - Ponto Registrado (Escala Especial)",
                    recipient=email,
                    body=f"""
                    Prezado(a) {user_name},

                    Este e-mail confirma o registro de sua SAÍDA conforme as informações abaixo:

                    Saída registrada com sucesso (Escala {tipo_escala}).

                    Profissional: {user_name}
                    Data/Hora Entrada: {entrada_aberta[1]} {entrada_aberta[2]}
                    Data/Hora Saída: {data_hora.strftime('%d/%m/%Y %H:%M:%S')}
                    Duração do Turno: {horas}h {minutos}min
                    Unidade: {unidade_nome}

                    Se precisar de suporte ou tiver dúvidas, entre em contato com a Prefeitura de Itaguaí.

                    Atenciosamente,
                    Prefeitura de Itaguaí
                    """
                )

        else:
            # ========================================
            # 📋 LÓGICA PARA ESCALAS NORMAIS (mantém como estava)
            # ========================================
            print(f"[DEBUG] Funcionário {user_name} tem escala normal: {tipo_escala}")
            
            # Último ponto do dia
            cursor.execute("""
                SELECT id, hora_entrada, hora_saida FROM registros_ponto 
                WHERE funcionario_id = %s AND DATE(data_hora) = %s 
                ORDER BY data_hora DESC LIMIT 1
            """, (funcionario_id, data_atual))
            ultimo_ponto = cursor.fetchone()

            hora_entrada = None
            hora_saida = None

            if not ultimo_ponto:
                # Registro de entrada
                hora_entrada = data_hora.strftime("%H:%M:%S")
                cursor.execute("""
                    INSERT INTO registros_ponto (funcionario_id, unidade_id, data_hora, hora_entrada, hora_saida, id_biometrico)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (funcionario_id, unidade_id, data_hora, hora_entrada, hora_saida, id_biometrico))

                mensagem = (
                    f"Registro de entrada realizado com sucesso na unidade: {unidade_nome}\n"
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
                hora_saida = data_hora.strftime("%H:%M:%S")
                cursor.execute("""
                    UPDATE registros_ponto
                    SET hora_saida = %s
                    WHERE id = %s
                """, (hora_saida, ultimo_ponto[0]))
                
                mensagem = (
                    f"Registro de saida realizado com sucesso na unidade: {unidade_nome}\n"
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
                    Data/Hora: {data_hora.strftime('%d/%m/%Y %H:%M:%S')}

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
            "matricula": matricula,
            "tipo_escala": tipo_escala,
            "is_escala_especial": is_escala_especial,
            "registro_ponto": {
                "data_hora": data_hora.strftime("%d/%m/%Y %H:%M:%S"),
                "funcionario_nome": user_name,
                "id_biometrico": id_biometrico
            }
        }), 200

    else:
        return jsonify({"message": "Impressão digital não reconhecida. Tente novamente."}), 401
