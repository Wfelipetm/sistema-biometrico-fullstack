from functools import wraps
from flask import request, jsonify
from app.db.database import get_db_connection

def usuario_autenticado(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Espera receber o email do usuário autenticado no header Authorization
        usuario_email = request.headers.get('Authorization')
        if not usuario_email:
            return jsonify({'message': 'Usuário não autenticado!'}), 401

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, nome, papel FROM usuarios WHERE email = %s", (usuario_email,))
        usuario = cursor.fetchone()
        cursor.close()
        conn.close()

        if not usuario:
            return jsonify({'message': 'Usuário não encontrado ou não autenticado!'}), 401

        # Adiciona info do usuário ao request para uso nas rotas, se necessário
        request.usuario_id = usuario[0]
        request.usuario_nome = usuario[1]
        request.usuario_papel = usuario[2]
        return f(*args, **kwargs)
    return decorated
