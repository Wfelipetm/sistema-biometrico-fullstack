import comtypes.client


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