# app/routes/pontoRoutes.py

from flask import request, jsonify
from app.controller.pontoController import register_ponto

def ponto_routes(app):
    app.add_url_rule('/register_ponto', 'register_ponto', register_ponto, methods=['POST'])
