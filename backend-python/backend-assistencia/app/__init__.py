from flask import Flask
from app.services.mail import mail, init_mail

def create_app():
    app = Flask(__name__)

    # Inicializa o serviço de e-mail
    init_mail(app)

    return app
