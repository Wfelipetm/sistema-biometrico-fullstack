package br.com.bio.biomtria;

import com.nitgen.SDK.BSP.NBioBSPJNI;

public class FingerprintDeviceTest {

    private NBioBSPJNI bsp;

    public FingerprintDeviceTest() {
        // Inicializando o BSP
        bsp = new NBioBSPJNI();
    }

    public String testDeviceInitialization() {
        try {
            // Abrindo o dispositivo
            int ret = bsp.OpenDevice(); // Usando OpenDevice para abrir o dispositivo biométrico

            if (ret != NBioBSPJNI.ERROR.NBioAPIERROR_NONE) {
                return "Falha na inicialização do dispositivo. Erro: " + bsp.GetErrorCode();
            }

            // Se o dispositivo foi aberto com sucesso
            return "Dispositivo inicializado com sucesso!";
        } catch (Exception e) {
            return "Erro: " + e.getMessage();
        } finally {
            // Fechando o dispositivo após o teste
            bsp.CloseDevice();
        }
    }

    public static void main(String[] args) {
        FingerprintDeviceTest test = new FingerprintDeviceTest();
        String result = test.testDeviceInitialization();
        System.out.println(result);
    }
}
