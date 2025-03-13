from flask import request, jsonify
from app.services.biometric import enroll_user
from app.db.database import get_db_connection
from datetime import datetime
from datetime import datetime





# Função para registrar o usuário
def register_user():
    data = request.json
    user_name = data['userName']
    cpf = data['cpf']
    cargo = data.get('cargo', '')
    matricula = data['matricula']
    unidade_id = data['unidade_id']
   
    try:
        
        id_biometrico = enroll_user(matricula)  
    except Exception as e:
        return jsonify({"message": f"Erro durante o registro biométrico: {str(e)}"}), 500

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM funcionarios WHERE id_biometrico = %s OR cpf = %s", (id_biometrico, cpf))

    existing_user = cursor.fetchone()

    if existing_user:
        return jsonify({"message": "User ID or CPF already exists"}), 400

    
    cursor.execute("SELECT * FROM funcionarios WHERE matricula = %s", (matricula,))
    existing_matricula = cursor.fetchone()

    if existing_matricula:
        return jsonify({"message": "Matrícula already exists"}), 400

    
    current_time = datetime.now()

    
    cursor.execute(""" 
        INSERT INTO funcionarios (nome, cpf, cargo, id_biometrico, unidade_id, matricula,  data_admissao, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_DATE, CURRENT_DATE)
    """, (user_name, cpf, cargo, id_biometrico, unidade_id, matricula,  current_time))
    conn.commit()

    cursor.execute("SELECT * FROM funcionarios WHERE matricula = %s", (matricula,))
    registered_user = cursor.fetchone()

    cursor.close()
    conn.close()

   
    return jsonify({
        "message": "User registered successfully",
        "user": {
            "id": registered_user[0],
            "nome": registered_user[1],
            "cpf": registered_user[2],
            "cargo": registered_user[3],
            "data_admissao": registered_user[4],
            "id_biometrico": registered_user[5],
            "unidade_id": registered_user[6],
            "matricula": registered_user[7],
     
            "created_at": registered_user[8],
            "updated_at": registered_user[9]
        }
    }), 200
