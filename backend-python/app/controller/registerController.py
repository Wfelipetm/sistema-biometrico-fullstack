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

# NOVA FUNÇÃO: Atualizar biometria do funcionário
def update_biometric():
    data = request.json
    funcionario_id = data.get('funcionario_id')
    matricula = data.get('matricula')
    
    # Validação: deve fornecer ID ou matrícula
    if not funcionario_id and not matricula:
        return jsonify({"message": "É necessário fornecer funcionario_id ou matricula"}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Buscar funcionário existente
    if funcionario_id:
        cursor.execute("SELECT id, nome, matricula, id_biometrico FROM funcionarios WHERE id = %s", (funcionario_id,))
    else:
        cursor.execute("SELECT id, nome, matricula, id_biometrico FROM funcionarios WHERE matricula = %s", (matricula,))
    
    funcionario = cursor.fetchone()
    
    if not funcionario:
        cursor.close()
        conn.close()
        return jsonify({"message": "Funcionário não encontrado"}), 404
    
    func_id, nome, matricula_func, id_biometrico_antigo = funcionario
    
    try:
        # Registrar nova biometria usando a matrícula
        novo_id_biometrico = enroll_user(matricula_func)
        
        # Verificar se o novo ID biométrico já existe em outro funcionário
        cursor.execute("SELECT id, nome FROM funcionarios WHERE id_biometrico = %s AND id != %s", (novo_id_biometrico, func_id))
        conflito = cursor.fetchone()
        
        if conflito:
            cursor.close()
            conn.close()
            return jsonify({"message": f"Este ID biométrico já está sendo usado por outro funcionário: {conflito[1]}"}), 400
        
        # Atualizar o id_biometrico no banco
        cursor.execute("""
            UPDATE funcionarios 
            SET id_biometrico = %s, updated_at = CURRENT_DATE 
            WHERE id = %s
        """, (novo_id_biometrico, func_id))
        
        conn.commit()
        
        # Buscar dados atualizados
        cursor.execute("SELECT * FROM funcionarios WHERE id = %s", (func_id,))
        funcionario_atualizado = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        print(f"[BIOMETRIA ATUALIZADA] Funcionário: {nome} | ID: {func_id} | Matrícula: {matricula_func} | ID Biométrico Antigo: {id_biometrico_antigo} | Novo ID Biométrico: {novo_id_biometrico}")
        
        return jsonify({
            "message": f"Biometria atualizada com sucesso para {nome}",
            "funcionario": {
                "id": funcionario_atualizado[0],
                "nome": funcionario_atualizado[1],
                "cpf": funcionario_atualizado[2],
                "cargo": funcionario_atualizado[3],
                "data_admissao": funcionario_atualizado[4],
                "id_biometrico_antigo": id_biometrico_antigo,
                "id_biometrico_novo": funcionario_atualizado[5],
                "unidade_id": funcionario_atualizado[6],
                "matricula": funcionario_atualizado[7],
                "tipo_escala": funcionario_atualizado[8],
                "telefone": funcionario_atualizado[9],
                "email": funcionario_atualizado[12],
                "updated_at": funcionario_atualizado[11]
            }
        }), 200
        
    except Exception as e:
        cursor.close()
        conn.close()
        return jsonify({"message": f"Erro ao atualizar biometria: {str(e)}"}), 500

# NOVA FUNÇÃO: Listar funcionários para seleção
def list_funcionarios_for_biometric():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT f.id, f.nome, f.matricula, f.cargo, u.nome as unidade_nome, f.id_biometrico
        FROM funcionarios f
        LEFT JOIN unidades u ON f.unidade_id = u.id
        ORDER BY f.nome
    """)
    
    funcionarios = cursor.fetchall()
    cursor.close()
    conn.close()
    
    funcionarios_list = []
    for func in funcionarios:
        funcionarios_list.append({
            "id": func[0],
            "nome": func[1],
            "matricula": func[2],
            "cargo": func[3],
            "unidade": func[4],
            "id_biometrico": func[5]
        })
    
    return jsonify({"funcionarios": funcionarios_list}), 200