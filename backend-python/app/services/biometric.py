import comtypes.client
import time

# Inicializando a biometria
NBioBSP = comtypes.client.CreateObject("NBioBSPCOM.NBioBSP")
Device = NBioBSP.Device
Extraction = NBioBSP.Extraction
IndexSearch = NBioBSP.IndexSearch 

def enroll_user(id_biometrico):
    Device.Open(255)
    Extraction.Enroll(id_biometrico, 0)
    Device.Close(255)
    return Extraction.TextEncodeFIR

def identify_user():
    Extraction.WindowStyle = 1
    Device.Open(255)
    Extraction.Capture(1)
    Device.Close(255)
    return Extraction.TextEncodeFIR

    print("Iniciando identificação automática...")
    try:
        Extraction.WindowStyle = 1
        Device.Open(255)
        print("Leitor ativo - coloque o dedo.")
        while not Device.CheckFinger:
            time.sleep(0.1)
        print("Dedo detectado. Capturando digital...")
        Extraction.Capture(1)
        fir_data = Extraction.TextEncodeFIR
        Device.Close(255)
        if fir_data:
            print("Digital capturada com sucesso.")
            return fir_data
        else:
            print("Erro na captura da digital.")
            return None
    except Exception as e:
        print(f"Erro na identificação: {e}")
        try:
            Device.Close(255)
        except:
            pass
        return None

def identify_forever():
    from app.db.database import get_db_connection
    print("[BIOMETRIC] Modo identificação contínua iniciado.")
    try:
        Device.Open(255)
        Extraction.WindowStyle = 1
        led_supported = True
        try:
            Device.SetLED(True)
            print("[BIOMETRIC] LED do leitor aceso (ativo).")
        except Exception:
            print("[BIOMETRIC] LED não suportado ou erro ao acender.")
            led_supported = False

        while True:
            print("[BIOMETRIC] Aguardando dedo no leitor...")
            # LED sempre aceso enquanto espera dedo
            while not Device.CheckFinger:
                try:
                    Device.SetLED(True)
                except Exception:
                    pass
                time.sleep(0.1)

            # Atualiza a base de digitais ANTES de capturar
            IndexSearch.ClearDB()
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id_biometrico, id FROM funcionarios")
            for row in cursor.fetchall():
                IndexSearch.AddFIR(row[0], int(row[1]))
            conn.close()

            print("[BIOMETRIC] Dedo detectado. Capturando...")
            Extraction.Capture(1)
            fir_data = Extraction.TextEncodeFIR

            IndexSearch.IdentifyUser(fir_data, 5)
            if IndexSearch.UserID != 0:
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT nome, id_biometrico, cpf, cargo, matricula, unidade_id, data_admissao FROM funcionarios WHERE id = %s",
                    (IndexSearch.UserID,)
                )
                user = cursor.fetchone()
                conn.close()
                if user:
                    user_name, id_biometrico, cpf, cargo, matricula, unidade_id, data_admissao = user
                    data_admissao_formatada = data_admissao.strftime("%d/%m/%Y") if hasattr(data_admissao, 'strftime') else str(data_admissao)
                    print(
                        f"[IDENTIFY] Usuário identificado: {user_name} "
                        f"| ID biométrico: {id_biometrico} "
                        f"| CPF: {cpf} "
                        f"| Cargo: {cargo} "
                        f"| Matrícula: {matricula} "
                        f"| Unidade: {unidade_id} "
                        f"| Admissão: {data_admissao_formatada}"
                    )
                else:
                    print("[IDENTIFY] Usuário identificado, mas não encontrado no banco de dados.")
            else:
                print("[BIOMETRIC] Usuário não identificado.")

            print("[BIOMETRIC] Aguarde remover o dedo do leitor...")
            while Device.CheckFinger:
                time.sleep(0.1)

    finally:
        try:
            Device.SetLED(False)
        except Exception:
            pass
        Device.Close(255)

