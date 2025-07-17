
from app.routes import create_app
from app.db.database import get_db_connection  
from app.services.mail import mail, init_mail
from flask_cors import CORS
import os
import threading
# from app.controller.identifyController import identify_user_continuous  # Importe sua função contínua
from app.services.biometric import identify_forever
from flask_socketio import SocketIO

# Inicializa a aplicação e o serviço de e-mail

app = create_app()
init_mail(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Ativando CORS somente para o domínio específico com suporte a cookies
CORS(
    app,
    supports_credentials=True,
    origins=["https://prefeitura.itaguai.rj.gov.br"]
)

# Teste de conexão com o banco de dados
conn = get_db_connection()
if conn:
    print("Conectado ao banco de dados com sucesso!")
    conn.close()
else:
    print("Falha ao conectar ao banco de dados.")


def start_biometric_thread():
    # Passa o socketio para o identify_forever
    t = threading.Thread(target=identify_forever, daemon=True)
    t.start()
    print("[SERVER] Identificação biométrica contínua iniciada.")

if __name__ == '__main__':
    cert_path = os.path.abspath(r'C:\https\cert1.pem')
    key_path = os.path.abspath(r'C:\https\privkey1.pem')
    if not (os.path.exists(cert_path) and os.path.exists(key_path)):
        raise FileNotFoundError("Certificado ou chave SSL não encontrados.")
    start_biometric_thread()
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, ssl_context=(cert_path, key_path))
