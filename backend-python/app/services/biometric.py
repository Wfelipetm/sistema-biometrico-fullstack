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

def identify_forever():
    print("[BIOMETRIC] Modo identificação contínua iniciado.")
    try:
        Device.Open(255)
        Extraction.WindowStyle = 1
        try:
            Device.SetLED(True)
        except Exception:
            pass

        while True:
            time.sleep(1)  # Apenas mantém o loop ativo, sem lógica biométrica

    finally:
        try:
            Device.SetLED(False)
        except Exception:
            pass
        Device.Close(255)

