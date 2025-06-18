from app.routes import create_app
from app.db.database import get_db_connection  
from app.services.mail import mail, init_mail
import os
from flask_cors import CORS

app = create_app()
init_mail(app)

# Ativando CORS se necessário
# CORS(
#     app,
#     supports_credentials=True,
#     origins=["https://prefeitura.itaguai.rj.gov.br"]
# )

conn = get_db_connection()
if conn:
    print("Conectado ao banco de dados com sucesso!")
    conn.close()
else:
    print("Falha ao conectar ao banco de dados.")

if __name__ == '__main__':
    # Caminho absoluto dos certificados SSL na pasta C:\httpspy
    cert_path = os.path.abspath('C:\\httpspy\\cert.pem')
    key_path = os.path.abspath('C:\\httpspy\\key.pem')

    # Executando a aplicação com HTTPS
    app.run(
        debug=True,
        host='0.0.0.0',
        port=5000,
        ssl_context=(cert_path, key_path)
    )
