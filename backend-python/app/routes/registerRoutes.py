# app/routes/registerRoutes.py

from flask import request, jsonify
from app.controller.registerController import register_user, update_biometric, list_funcionarios_for_biometric

def register_routes(app):
    app.add_url_rule('/register', 'register', register_user, methods=['POST'])
    app.add_url_rule('/update-biometric', 'update_biometric', update_biometric, methods=['POST'])
    app.add_url_rule('/funcionarios-biometric', 'list_funcionarios_biometric', list_funcionarios_for_biometric, methods=['GET'])
