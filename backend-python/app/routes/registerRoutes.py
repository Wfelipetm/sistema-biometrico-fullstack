# app/routes/registerRoutes.py

from flask import request, jsonify
from app.controller.registerController import register_user

def register_routes(app):
    app.add_url_rule('/register', 'register', register_user, methods=['POST'])
