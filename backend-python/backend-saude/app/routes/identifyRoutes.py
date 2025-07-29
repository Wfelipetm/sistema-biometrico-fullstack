# app/routes/identifyRoutes.py

from flask import request, jsonify
from app.controller.identifyController import identify_user_route

def identify_routes(app):
    app.add_url_rule('/identify', 'identify', identify_user_route, methods=['GET'])
