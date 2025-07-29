# app/__init__.py

from flask import Flask
from flask_cors import CORS

# Importando os arquivos de rotas
from app.routes.registerRoutes import register_routes
from app.routes.identifyRoutes import identify_routes
from app.routes.pontoRoutes import ponto_routes

def create_app():
    app = Flask(__name__)

    # Habilita o CORS para todas as rotas
    CORS(app)

    # Registrando as rotas
    register_routes(app)
    identify_routes(app)
    ponto_routes(app)

    return app
