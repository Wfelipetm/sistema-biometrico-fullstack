
from flask import  jsonify
from app.db.database import get_db_connection
from datetime import datetime
from datetime import datetime
from app.services.biometric import IndexSearch, identify_user








# identificar o usuário e registrar o ponto automaticamente
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

    # Captura os dados de biometria para identificação
    fir_data = identify_user()

    # Identificação do usuário
    IndexSearch.IdentifyUser(fir_data, 5)

    if IndexSearch.UserID != 0:
        id_biometrico = IndexSearch.UserID

        # Buscar os dados do usuário no banco de dados
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, nome, cpf, unidade_id, matricula, cargo, id_biometrico 
            FROM funcionarios WHERE id = %s
        """, (id_biometrico,))
        user_data = cursor.fetchone()

        funcionario_id = user_data[0]
        user_name = user_data[1]
        cpf = user_data[2]
        unidade_id = user_data[3]
        matricula = user_data[4]
        cargo = user_data[5]
        id_biometrico = user_data[6]  # Pegando o id_biometrico do banco

        # Verificar o último registro de ponto para definir entrada ou saída
        cursor.execute("""
            SELECT hora_entrada, hora_saida FROM registros_ponto 
            WHERE funcionario_id = %s ORDER BY data_hora DESC LIMIT 1
        """, (funcionario_id,))
        ultimo_ponto = cursor.fetchone()

        data_hora = datetime.now()
        hora_entrada = None
        hora_saida = None

        if not ultimo_ponto or ultimo_ponto[1] is not None:  # Se não há registro ou já tem saída
            hora_entrada = data_hora.strftime("%H:%M:%S")  # Registra entrada
        else:
            hora_saida = data_hora.strftime("%H:%M:%S")  # Registra saída

        # Inserir registro de ponto automaticamente, incluindo id_biometrico
        cursor.execute("""
            INSERT INTO registros_ponto (funcionario_id, unidade_id, data_hora, hora_entrada, hora_saida, id_biometrico)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (funcionario_id, unidade_id, data_hora, hora_entrada, hora_saida, id_biometrico))
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
                "id_biometrico": id_biometrico  # Retornando o id_biometrico no JSON
            }
        }), 200
    else:
        return jsonify({"message": "User not identified"}), 404
