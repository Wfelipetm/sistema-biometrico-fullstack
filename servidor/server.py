from app.routes import create_app
from app.db.database import get_db_connection  
from app.services.mail import mail, init_mail

app = create_app()
init_mail(app)




conn = get_db_connection()
if conn:
    print("Conectado ao banco de dados com sucesso!")
    conn.close()
else:
    print("Falha ao conectar ao banco de dados.")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
