# app/routes/vinculoRoutes.py

from flask import request, jsonify
from app.controller.vinculoController import criar_vinculo_adicional

def vinculo_routes(app):
    app.add_url_rule('/api/funcionarios/vinculos', 'criar_vinculo', criar_vinculo_adicional, methods=['POST'])
