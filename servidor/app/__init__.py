from flask import Flask
from flask_cors import CORS  # Importe o CORS
from .routes import register_user, identify_user_route

# Função para criar e configurar o app Flask
def create_app():
    app = Flask(__name__)

    # Habilita o CORS para todas as rotas
    CORS(app)

    # Definindo as rotas do Flask
    app.add_url_rule('/register', 'register', register_user, methods=['POST'])
    app.add_url_rule('/identify', 'identify', identify_user_route, methods=['GET'])

    return app
