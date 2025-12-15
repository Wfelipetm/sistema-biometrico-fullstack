# app/controller/vinculoController.py

from flask import request, jsonify
from app.services.biometric import enroll_user
from app.db.database import get_db_connection

# Tipos de escala válidos
TIPO_ESCALA_VALIDOS = ['8h', '12h', '16h', '24h', '12x36', '24x72', '32h', '20h']

def criar_vinculo_adicional():
    """
    Cria um vínculo adicional para funcionário em outra unidade.
    Um funcionário pode trabalhar em múltiplas unidades com matrículas diferentes.
    """
    # Verifica se o request contém JSON
    if not request.is_json:
        return jsonify({
            "message": "Content-Type deve ser application/json"
        }), 400
    
    try:
        data = request.get_json()
    except Exception as e:
        return jsonify({
            "message": f"Erro ao processar JSON: {str(e)}"
        }), 400
    
    if not data:
        return jsonify({
            "message": "Body da requisição está vazio"
        }), 400
    
    # Validação dos campos obrigatórios
    funcionario_id = data.get('funcionario_id')
    unidade_id = data.get('unidade_id')
    matricula = data.get('matricula')
    tipo_escala = data.get('tipo_escala')
    cargo = data.get('cargo')
    
    if not all([funcionario_id, unidade_id, matricula, tipo_escala, cargo]):
        return jsonify({
            "message": "funcionario_id, unidade_id, matricula, tipo_escala e cargo são obrigatórios"
        }), 400
    
    # Validação do tipo_escala
    if tipo_escala not in TIPO_ESCALA_VALIDOS:
        return jsonify({
            "message": f"Tipo de escala inválido. Valores válidos: {', '.join(TIPO_ESCALA_VALIDOS)}"
        }), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 1. Verifica se o funcionário existe
        cursor.execute("SELECT id, nome, cargo FROM funcionarios WHERE id = %s", (funcionario_id,))
        funcionario = cursor.fetchone()
        
        if not funcionario:
            return jsonify({"message": "Funcionário não encontrado"}), 404
        
        # Não é necessário validar se é médico - qualquer funcionário pode ter vínculos adicionais
        
        # 2. Verifica se a matrícula já existe na tabela funcionarios
        cursor.execute("SELECT id FROM funcionarios WHERE matricula = %s", (matricula,))
        matricula_existente = cursor.fetchone()
        
        if matricula_existente:
            return jsonify({"message": "Matrícula já existe"}), 400
        
        # 3. Verifica se a matrícula já existe em vínculos adicionais
        cursor.execute(
            "SELECT id FROM funcionarios_unidades_adicionais WHERE matricula = %s", 
            (matricula,)
        )
        matricula_vinculo_existente = cursor.fetchone()
        
        if matricula_vinculo_existente:
            return jsonify({"message": "Matrícula já existe nos vínculos adicionais"}), 400
        
        # 4. Registra a biometria usando o leitor biométrico
        try:
            id_biometrico = enroll_user(matricula)
        except Exception as e:
            return jsonify({
                "message": f"Erro durante o registro biométrico: {str(e)}"
            }), 500
        
        # 5. Insere o vínculo adicional no banco de dados
        cursor.execute("""
            INSERT INTO funcionarios_unidades_adicionais 
            (funcionario_id, unidade_id, matricula, id_biometrico, tipo_escala, cargo, status)
            VALUES (%s, %s, %s, %s, %s, %s, 1)
        """, (funcionario_id, unidade_id, matricula, id_biometrico, tipo_escala, cargo))
        
        conn.commit()
        
        return jsonify({
            "message": "Vínculo adicional criado com sucesso",
            "vinculo": {
                "funcionario_id": funcionario_id,
                "funcionario_nome": funcionario[1],
                "unidade_id": unidade_id,
                "matricula": matricula,
                "id_biometrico": id_biometrico,
                "tipo_escala": tipo_escala,
                "cargo": cargo,
                "status": 1
            }
        }), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({
            "message": f"Erro ao criar vínculo adicional: {str(e)}"
        }), 500
        
    finally:
        cursor.close()
        conn.close()
