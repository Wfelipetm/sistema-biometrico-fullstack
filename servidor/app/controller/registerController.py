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
    # foto = data.get('foto', None)

    # Gerar o id_biometrico usando a função enroll_user e passando o valor necessário (por exemplo, matricula)
    try:
        # Passando matricula ou outro identificador necessário para enroll_user
        id_biometrico = enroll_user(matricula)  # Passando a matrícula ou outro parâmetro que a função espera
    except Exception as e:
        return jsonify({"message": f"Error during biometric enrollment: {str(e)}"}), 500

    # Verificar se o CPF ou ID biométrico já existe no banco de dados
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM funcionarios WHERE id_biometrico = %s OR cpf = %s", (id_biometrico, cpf))

    existing_user = cursor.fetchone()

    if existing_user:
        return jsonify({"message": "User ID or CPF already exists"}), 400

    # Verificar se a matrícula já existe
    cursor.execute("SELECT * FROM funcionarios WHERE matricula = %s", (matricula,))
    existing_matricula = cursor.fetchone()

    if existing_matricula:
        return jsonify({"message": "Matrícula already exists"}), 400

    # Pegar a hora atual para data_admissao
    current_time = datetime.now()

    # Salvar no banco de dados
    cursor.execute(""" 
        INSERT INTO funcionarios (nome, cpf, cargo, id_biometrico, unidade_id, matricula,  data_admissao, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_DATE, CURRENT_DATE)
    """, (user_name, cpf, cargo, id_biometrico, unidade_id, matricula,  current_time))
    conn.commit()

    # Buscar o usuário recém registrado para retornar os dados
    cursor.execute("SELECT * FROM funcionarios WHERE matricula = %s", (matricula,))
    registered_user = cursor.fetchone()

    cursor.close()
    conn.close()

    # Retornar todos os dados cadastrados, mas sem o token
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
