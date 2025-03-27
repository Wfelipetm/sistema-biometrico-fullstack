from flask_mail import Mail

mail = Mail()

def init_mail(app):
    app.config['MAIL_SERVER'] = 'smtp-apl.serpro.gov.br'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USE_SSL'] = False
    app.config['MAIL_DEFAULT_SENDER'] = ('MARCAÇÃO DE PONTO', 'naoresponda@itaguai.rj.gov.br')

    mail.init_app(app)
