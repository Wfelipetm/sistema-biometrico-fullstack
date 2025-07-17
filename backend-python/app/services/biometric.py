import comtypes.client
import time
import threading

# Inicializando a biometria
NBioBSP = comtypes.client.CreateObject("NBioBSPCOM.NBioBSP")
Device = NBioBSP.Device
Extraction = NBioBSP.Extraction
IndexSearch = NBioBSP.IndexSearch

# Lock global para acesso exclusivo ao leitor biométrico
biometric_lock = threading.Lock()

def enroll_user(id_biometrico):
    with biometric_lock:
        Device.Open(255)
        Extraction.Enroll(id_biometrico, 0)
        Device.Close(255)
        return Extraction.TextEncodeFIR

def identify_user():
    with biometric_lock:
        Extraction.WindowStyle = 1
        Device.Open(255)
        Extraction.Capture(1)
        fir_data = Extraction.TextEncodeFIR
        Device.Close(255)
        return fir_data
    

    

def identify_forever():
    from app.db.database import get_db_connection
    try:
        Device.Open(255)
        Extraction.WindowStyle = 1
        try:
            Device.SetLED(True)
        except Exception:
            pass

        while True:
            with biometric_lock:
                while not Device.CheckFinger:
                    try:
                        Device.SetLED(True)
                    except Exception:
                        pass
                    time.sleep(0.1)

                IndexSearch.ClearDB()
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT id_biometrico, id FROM funcionarios")
                for row in cursor.fetchall():
                    IndexSearch.AddFIR(row[0], int(row[1]))
                conn.close()

                Extraction.Capture(1)
                fir_data = Extraction.TextEncodeFIR

                IndexSearch.IdentifyUser(fir_data, 5)
                # Aqui você pode tratar o usuário identificado, se quiser

                while Device.CheckFinger:
                    time.sleep(0.1)
            time.sleep(0.1)  # Pequeno delay para evitar uso excessivo de CPU

    finally:
        try:
            Device.SetLED(False)
        except Exception:
            pass
        Device.Close(255)
