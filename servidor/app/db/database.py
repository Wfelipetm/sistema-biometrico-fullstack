import psycopg2

# Configuração do banco de dados
DB_HOST = 'biometrico.itaguai.rj.gov.br'
DB_PORT = 5432
DB_NAME = 'biometrico'
DB_USER = 'postgres'
DB_PASSWORD = 'B10m3Tr1@'

# Função para conectar ao banco de dados
def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        print("Conexão com o banco de dados estabelecida!")
        return conn
    except Exception as e:
        print(f"Erro ao conectar ao banco de dados: {e}")
        return None
