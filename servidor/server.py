from app.routes import create_app
from app.db.database import get_db_connection
from flask_cors import CORS
import os

# Criação da aplicação Flask
app = create_app()

# Ativando CORS somente para o domínio específico e com suporte a cookies
CORS(
    app,
    supports_credentials=True,
    origins=["https://prefeitura.itaguai.rj.gov.br"]
)

# Verificando conexão com o banco de dados
conn = get_db_connection()
if conn:
    print("Conectado ao banco de dados com sucesso!")
    conn.close()
else:
    print("Falha ao conectar ao banco de dados.")

if __name__ == '__main__':
    # Certificados SSL
    cert_path = os.path.abspath('C:\\https\\cert.pem')
    key_path = os.path.abspath('C:\\https\\key.pem')

    # Executando a aplicação com SSL
    app.run(
        debug=True,
        host='0.0.0.0',
        port=5000,
        ssl_context=(cert_path, key_path)
    )
