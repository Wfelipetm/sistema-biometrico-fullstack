from flask import request, jsonify
from app.db.database import get_db_connection
from app.services.biometric import IndexSearch, identify_user
import time




# identificar o usuário
def identify_user_route():
    # Limpa o banco de dados de indexação
    IndexSearch.ClearDB()

    # Conectar ao banco de dados
    conn = get_db_connection()
    cursor = conn.cursor()

    # Buscar todos os usuários no banco de dados e adicionar FIR à indexação
    cursor.execute("SELECT id_biometrico, id FROM funcionarios")
    for row in cursor.fetchall():
        # A adição de FIR para indexação
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

        cursor.execute("SELECT nome, cpf, data_admissao, unidade_id, matricula, cargo FROM funcionarios WHERE id = %s", (id_biometrico,))
        user_data = cursor.fetchone()
        user_name = user_data[0]
        cpf = user_data[1]
        data_admissao = user_data[2]
        unidade_id = user_data[3]
        matricula = user_data[4]
      
        cargo = user_data[5]

        conn.close()

        # Recuperando a data_admissao diretamente do banco de dados
        data_admissao_formatada = data_admissao.strftime("%d/%m/%Y")  

        return jsonify({
            "message": f"User identified: {user_name} (ID: {id_biometrico})",
            "cpf": cpf,
            "cargo": cargo,
            "data_admissao": data_admissao_formatada,
            "unidade_id": unidade_id,
            "matricula": matricula
        
        }), 200
    else:
        return jsonify({"message": "User not identified"}), 404


