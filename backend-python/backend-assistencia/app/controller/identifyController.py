from flask import request, jsonify
from app.services.biometric import enroll_user
from app.db.database import get_db_connection
from app.services.biometric import IndexSearch, enroll_user, identify_user




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
    
    # Buscar também os vínculos adicionais e adicionar à indexação
    # Usar offset de 1000000 para diferenciar vínculos de funcionários principais
    VINCULO_OFFSET = 1000000
    cursor.execute("SELECT id_biometrico, id FROM funcionarios_unidades_adicionais WHERE status = 1")
    vinculos = cursor.fetchall()
    print(f"DEBUG: Encontrados {len(vinculos)} vínculos adicionais ativos")
    for row in vinculos:
        vinculo_user_id = VINCULO_OFFSET + int(row[1])
        print(f"DEBUG: Adicionando vínculo - id original: {row[1]}, id indexado: {vinculo_user_id}")
        # id_biometrico é a string FIR
        IndexSearch.AddFIR(row[0], vinculo_user_id)

    conn.close()

    # Captura os dados de biometria para identificação
    fir_data = identify_user()

    # Identificação do usuário
    IndexSearch.IdentifyUser(fir_data, 5)

    if IndexSearch.UserID != 0:
        id_identificado = IndexSearch.UserID
        print(f"DEBUG: ID identificado: {id_identificado}")

        # Conectar ao banco de dados
        conn = get_db_connection()
        cursor = conn.cursor()

        # Verifica se é um vínculo adicional (ID >= VINCULO_OFFSET)
        if id_identificado >= VINCULO_OFFSET:
            # É um vínculo adicional - remove o offset para obter o ID real
            vinculo_id = id_identificado - VINCULO_OFFSET
            print(f"DEBUG: É um vínculo! ID real: {vinculo_id}")
            cursor.execute("""
                SELECT fua.matricula, fua.cargo, fua.unidade_id, 
                       f.nome, f.cpf, f.data_admissao, fua.funcionario_id
                FROM funcionarios_unidades_adicionais fua
                INNER JOIN funcionarios f ON fua.funcionario_id = f.id
                WHERE fua.id = %s AND fua.status = 1
            """, (vinculo_id,))
            vinculo_data = cursor.fetchone()
            
            if vinculo_data:
                matricula = str(vinculo_data[0])  # matricula é bigint
                cargo = vinculo_data[1]
                unidade_id = vinculo_data[2]
                user_name = vinculo_data[3]
                cpf = vinculo_data[4]
                data_admissao = vinculo_data[5]
                funcionario_id = vinculo_data[6]
                
                conn.close()
                
                data_admissao_formatada = data_admissao.strftime("%d/%m/%Y")
                
                return jsonify({
                    "message": f"User identified: {user_name} (Vínculo Adicional)",
                    "cpf": cpf,
                    "cargo": cargo,
                    "data_admissao": data_admissao_formatada,
                    "unidade_id": unidade_id,
                    "matricula": matricula,
                    "funcionario_id": funcionario_id,
                    "tipo": "vinculo_adicional"
                }), 200
            else:
                conn.close()
                return jsonify({"message": "Vínculo adicional não encontrado"}), 404
        else:
            # É um funcionário principal
            cursor.execute("""
                SELECT nome, cpf, data_admissao, unidade_id, matricula, cargo, id 
                FROM funcionarios 
                WHERE id = %s
            """, (id_identificado,))
            user_data = cursor.fetchone()
            
            if user_data:
                user_name = user_data[0]
                cpf = user_data[1]
                data_admissao = user_data[2]
                unidade_id = user_data[3]
                matricula = user_data[4]
                cargo = user_data[5]
                funcionario_id = user_data[6]
                
                conn.close()
                
                data_admissao_formatada = data_admissao.strftime("%d/%m/%Y")
                
                return jsonify({
                    "message": f"User identified: {user_name} (ID: {id_identificado})",
                    "cpf": cpf,
                    "cargo": cargo,
                    "data_admissao": data_admissao_formatada,
                    "unidade_id": unidade_id,
                    "matricula": matricula,
                    "funcionario_id": funcionario_id,
                    "tipo": "funcionario_principal"
                }), 200
            else:
                conn.close()
                return jsonify({"message": "Funcionário principal não encontrado"}), 404
    else:
        return jsonify({"message": "User not identified"}), 404