
import eventlet
eventlet.monkey_patch()

from app.routes import create_app
from app.db.database import get_db_connection  
from app.services.mail import mail, init_mail
from flask_cors import CORS
import os
import threading
from app.services.biometric import identify_forever
import threading

# Controle de processamento de biometria
biometria_liberada = threading.Event()
biometria_liberada.set()  # Libera a primeira leitura
from flask_socketio import SocketIO

# Inicializa a aplicação e o serviço de e-mail

app = create_app()
init_mail(app)
SOCKET_CORS = "*"  # Permitir qualquer origem temporariamente para teste



socketio = SocketIO(app, cors_allowed_origins=SOCKET_CORS, async_mode="eventlet")


# Log detalhado de erro de handshake
@socketio.on_error_default
def default_error_handler(e):
    from flask import request
    print(f"[SOCKETIO][ERRO] Erro no evento {request.event}: {e}")

# Log de conexão WebSocket
from flask import request
@socketio.on('connect')
def handle_connect():
    print(f'[SOCKETIO] Cliente conectado: {request.remote_addr}')

# Handler para confirmação do frontend (precisa estar depois do socketio)
@socketio.on('biometria_processada')
def handle_biometria_processada():
    print('[SOCKETIO] Frontend confirmou processamento da biometria, liberando próxima leitura.')
    biometria_liberada.set()

# Ativando CORS para os mesmos domínios do SocketIO
CORS(
    app,
    supports_credentials=True,
    origins=SOCKET_CORS
)

# Log para cada requisição recebida
@app.before_request
def log_request():
    from flask import request
    print(f"[REQUEST] {request.method} {request.path} de {request.remote_addr}")

# Teste de conexão com o banco de dados
conn = get_db_connection()
if conn:
    print("Conectado ao banco de dados com sucesso!")
    conn.close()
else:
    print("Falha ao conectar ao banco de dados.")



def start_biometric_thread():
    def identify_forever_ack(socketio):
        from app.services.biometric import identify_forever as original_identify_forever
        ciclo = 0
        while True:
            print("[SERVER] Aguardando liberação do frontend para iniciar leitura biométrica...")
            biometria_liberada.wait()  # Espera liberação do frontend
            print("[SERVER] Liberação recebida! Iniciando ciclo biométrico.")
            biometria_liberada.clear()
            ciclo += 1
            try:
                original_identify_forever(socketio)
            except Exception as e:
                print(f"[SERVER] Erro no ciclo biométrico {ciclo}: {e}")
    # Inicia apenas uma thread biométrica
    if not hasattr(start_biometric_thread, "started"):
        socketio.start_background_task(identify_forever_ack, socketio)
        start_biometric_thread.started = True
        print("[SERVER] Identificação biométrica contínua iniciada (com controle de ack do frontend).")

if __name__ == '__main__':
    import eventlet
    import eventlet.wsgi
    import ssl
    cert_path = os.path.abspath(r'C:\https\cert1.pem')
    key_path = os.path.abspath(r'C:\https\privkey1.pem')
    if not (os.path.exists(cert_path) and os.path.exists(key_path)):
        raise FileNotFoundError("Certificado ou chave SSL não encontrados.")
    start_biometric_thread()
    # Configura SSL manualmente para eventlet
    ssl_args = {
        'certfile': cert_path,
        'keyfile': key_path
    }
    listener = eventlet.listen(('0.0.0.0', 5000))
    ssl_listener = eventlet.wrap_ssl(listener, server_side=True, **ssl_args)
    print("[SERVER] Servidor Flask-SocketIO rodando com SSL em https://0.0.0.0:5000")
    try:
        eventlet.wsgi.server(ssl_listener, app)
    except KeyboardInterrupt:
        print("\n[SERVER] Encerrado pelo usuário (Ctrl+C). Saindo de forma limpa.")
