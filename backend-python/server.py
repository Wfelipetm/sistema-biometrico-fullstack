from app.routes import create_app
from app.db.database import get_db_connection  
from app.services.mail import mail, init_mail
import os
from flask_cors import CORS


app = create_app()
init_mail(app)


# Ativando CORS somente para o domínio específico e com suporte a cookies
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
