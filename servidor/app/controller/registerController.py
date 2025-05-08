from flask import request, jsonify
from app.services.biometric import enroll_user
from app.db.database import get_db_connection
from datetime import datetime


TIPO_ESCALA_VALIDOS = ['8h', '12h', '16h', '24h', '12x36', '24x72', '32h', '20h']

# Função para registrar o usuário
def register_user():
    data = request.json
    user_name = data['userName']
    cpf = data['cpf']
    cargo = data.get('cargo', '')
    matricula = data['matricula']
    unidade_id = data['unidade_id']
    data_admissao = data['data_admissao']
    
    # Verificação e log de tipo_escala
    tipo_escala = data.get('tipo_escala')
    
    # Verificando se o tipo_escala é válido
    if tipo_escala not in TIPO_ESCALA_VALIDOS:
        return jsonify({"message": "Tipo de escala inválido. Valores válidos: '8h', '12h', '16h', '24h', '12x36', '24x72', '32h', '20h'"}), 400
    
    telefone = data['telefone']
    email = data.get('email')  # Obtendo o email
    
    if not email:
        return jsonify({"message": "Email é obrigatório."}), 400  # Validando o email
    
    try:
        id_biometrico = enroll_user(matricula)
    except Exception as e:
        return jsonify({"message": f"Erro durante o registro biométrico: {str(e)}"}), 500

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM funcionarios WHERE id_biometrico = %s OR cpf = %s OR email = %s OR matricula = %s OR nome = %s", (id_biometrico, cpf, email, matricula, user_name))

    existing_user = cursor.fetchone()

    if existing_user:
        return jsonify({"message": "User ID, CPF, Email, Matrícula ou Nome já existe"}), 400

    cursor.execute("SELECT * FROM funcionarios WHERE matricula = %s", (matricula,))
    existing_matricula = cursor.fetchone()

    if existing_matricula:
        return jsonify({"message": "Matrícula already exists"}), 400

    # current_time = datetime.now()

    # Verificação do valor de tipo_escala antes de inserir
    print(f"tipo_escala: {tipo_escala}")  # Log para depuração

    cursor.execute(""" 
        INSERT INTO funcionarios (nome, cpf, cargo, id_biometrico, unidade_id, matricula, tipo_escala, telefone, email, data_admissao, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_DATE, CURRENT_DATE)
    """, (user_name, cpf, cargo, id_biometrico, unidade_id, matricula, tipo_escala, telefone, email, data_admissao))
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
            "tipo_escala": registered_user[8],
            "telefone": registered_user[9],
            "email": registered_user[12],  
            "created_at": registered_user[10],
            "updated_at": registered_user[11]
        }
    }), 200