package br.com.bio.biomtria.service;

import org.springframework.jdbc.core.JdbcTemplate;
import java.util.Map;
import java.util.List;
import java.util.Base64;

import com.nitgen.SDK.BSP.NBioBSPJNI;
import org.springframework.stereotype.Service;

/**
 * Serviço para gerenciar operações biométricas usando a API NITGEN
 */
@Service
public class BiometricService {
    private final NBioBSPJNI bsp;
    private int userID = 0;

    public BiometricService() {
        this.bsp = new NBioBSPJNI();
    }

    /**
     * Limpa o índice de busca biométrica temporária
     */
    public void clearIndexSearch() {
        // TODO: Implementar limpeza do índice quando necessário
    }

    /**
     * Adiciona um template biométrico ao índice de busca temporário
     * 
     * @param template Template biométrico (TextEncodedFIR ou byte[])
     * @param userId   ID do usuário associado ao template
     */
    public void addFIRToIndex(String template, int userId) {
        if (template == null) {
            return;
        }
        try {
            byte[] templateData = decodeBiometricTemplate(template);
            if (templateData != null && templateData.length > 0) {
                // TODO: Implementar adição ao índice quando necessário
            }
        } catch (Exception e) {
            // Silenciar erro
        }
    }

    /**
     * Captura e exporta o template biométrico como array de bytes
     * 
     * @return byte[] contendo o template biométrico, ou null em caso de erro
     */
    public byte[] enrollUserTemplate() {
        NBioBSPJNI.FIR_HANDLE hNewFIR = bsp.new FIR_HANDLE();
        NBioBSPJNI.FIR_HANDLE hAuditFIR = bsp.new FIR_HANDLE();

        try {
            // Abre o dispositivo
            int ret = bsp.OpenDevice();
            if (ret != NBioBSPJNI.ERROR.NBioAPIERROR_NONE) {
                return null;
            }
            // Captura a impressão digital para cadastro
            ret = bsp.Capture(NBioBSPJNI.FIR_PURPOSE.ENROLL, hNewFIR, -1, hAuditFIR, null);
            if (ret != NBioBSPJNI.ERROR.NBioAPIERROR_NONE) {
                bsp.CloseDevice();
                return null;
            }
            // Exporta o template capturado para bytes usando TextFIR
            NBioBSPJNI.FIR_TEXTENCODE textFIR = bsp.new FIR_TEXTENCODE();
            if (bsp.GetTextFIRFromHandle(hNewFIR, textFIR) != NBioBSPJNI.ERROR.NBioAPIERROR_NONE) {
                bsp.CloseDevice();
                return null;
            }

            System.out.println(
                    "Template capturado com sucesso, TextFIR: " + (textFIR.TextFIR != null ? "não nulo" : "nulo"));

            // Converte o TextFIR para bytes
            byte[] template = textFIR.TextFIR != null ? textFIR.TextFIR.getBytes("UTF-8") : null;
            bsp.CloseDevice();
            if (template != null && template.length > 0) {
                System.out.println("Tamanho do template em bytes: " + template.length);
                return template;
            } else {
                System.out.println("Falha ao obter template: template nulo ou vazio");
                return null;
            }
        } catch (Exception e) {
            try {
                bsp.CloseDevice();
            } catch (Exception ex) {
                // Ignora erros ao fechar o dispositivo
            }
            return null;
        }
    }

    /**
     * Identifica o usuário comparando a digital capturada com os templates do banco
     * 
     * @param jdbcTemplate JdbcTemplate para consulta ao banco
     * @return id do usuário identificado ou 0 se não encontrado
     */
    public int identifyUserByTemplate(JdbcTemplate jdbcTemplate) {
        System.out.println("[DEBUG] Iniciando identificação biométrica...");
        NBioBSPJNI.FIR_HANDLE hCapturedFIR = bsp.new FIR_HANDLE();
        NBioBSPJNI.FIR_HANDLE hAuditFIR = bsp.new FIR_HANDLE();
        boolean deviceOpened = false;

        try {
            int ret = bsp.OpenDevice();
            if (ret != NBioBSPJNI.ERROR.NBioAPIERROR_NONE) {
                System.out.println("[ERRO] Falha ao abrir dispositivo biométrico: " + ret);
                return 0;
            }
            deviceOpened = true;

            ret = bsp.Capture(NBioBSPJNI.FIR_PURPOSE.VERIFY, hCapturedFIR, -1, hAuditFIR, null);
            if (ret != NBioBSPJNI.ERROR.NBioAPIERROR_NONE) {
                System.out.println("[ERRO] Falha ao capturar impressão digital: " + ret);
                return 0;
            }

            // Fechar o dispositivo após a captura para liberar recursos
            bsp.CloseDevice();
            deviceOpened = false;

            System.out.println("[DEBUG] Dispositivo biométrico fechado após captura");

            // Preparando a consulta SQL com um limite para evitar processamento excessivo
            String sql = "SELECT id, id_biometrico FROM funcionarios WHERE id_biometrico IS NOT NULL";
            System.out.println("[DEBUG] Executando consulta SQL: " + sql);

            // Usar try-with-resources para gerenciar a conexão JDBC adequadamente
            List<Map<String, Object>> templates;
            try {
                templates = jdbcTemplate.queryForList(sql);
                System.out.println("[DEBUG] Consulta retornou " + templates.size() + " templates para comparação");
            } catch (Exception e) {
                System.out.println("[ERRO] Falha ao consultar banco de dados: " + e.getMessage());
                return 0;
            }

            NBioBSPJNI.INPUT_FIR inputCaptured = bsp.new INPUT_FIR();
            inputCaptured.SetFIRHandle(hCapturedFIR);
            for (Map<String, Object> row : templates) {
                int userId = (int) row.get("id");
                Object rawTemplate = row.get("id_biometrico");
                byte[] dbTemplate = null;
                if (rawTemplate instanceof String) {
                    String templateStr = (String) rawTemplate;
                    // Tenta decodificar de Base64
                    try {
                        dbTemplate = Base64.getDecoder().decode(templateStr);
                    } catch (Exception e) {
                        // Se falhar, usa a string como está
                        dbTemplate = templateStr.getBytes("UTF-8");
                    }
                } else if (rawTemplate instanceof byte[]) {
                    dbTemplate = (byte[]) rawTemplate;
                }
                if (dbTemplate == null || dbTemplate.length == 0) {
                    System.out.println("[AVISO] Template vazio para o usuário ID: " + userId + ", pulando...");
                    continue;
                }

                String dbTemplateStr;
                try {
                    dbTemplateStr = new String(dbTemplate, "UTF-8");
                    System.out.println("[DEBUG] Template recuperado para usuário ID: " + userId +
                            ", tamanho: " + dbTemplateStr.length() + " caracteres");
                } catch (Exception e) {
                    System.out.println("[ERRO] Falha ao converter template para string: " + e.getMessage());
                    continue;
                }

                NBioBSPJNI.FIR_TEXTENCODE dbTextFIR = bsp.new FIR_TEXTENCODE();
                dbTextFIR.TextFIR = dbTemplateStr;
                NBioBSPJNI.INPUT_FIR inputDb = bsp.new INPUT_FIR();
                inputDb.SetTextFIR(dbTextFIR);

                // Cria um objeto Boolean para receber o resultado da comparação
                Boolean match = Boolean.FALSE;
                NBioBSPJNI.FIR_PAYLOAD payload = bsp.new FIR_PAYLOAD();

                try {
                    // Realiza a verificação biométrica com tratamento de timeout
                    long startTime = System.currentTimeMillis();
                    int verifyResult = bsp.VerifyMatch(inputCaptured, inputDb, match, payload);
                    long endTime = System.currentTimeMillis();

                    System.out.println("[DEBUG] Verificação de ID " + userId + ": resultado=" + verifyResult
                            + ", match=" + match + ", tempo=" + (endTime - startTime) + "ms");

                    // Se houve correspondência
                    if (match) {
                        this.userID = userId;
                        System.out.println("[INFO] Usuário identificado com sucesso: userID=" + userId);
                        return userId;
                    }
                } catch (Exception e) {
                    System.out.println("[ERRO] Falha ao verificar ID " + userId + ": " + e.getMessage());
                    // Continuar com o próximo template sem interromper o processo
                    continue;
                }
            }
            this.userID = 0;
            return 0;
        } catch (Exception e) {
            System.out.println("Erro durante a identificação biométrica: " + e.getMessage());
            this.userID = 0;
            return 0;
        } finally {
            // Garantir que o dispositivo seja sempre fechado para liberar recursos
            try {
                // Verificar se ainda não foi fechado
                if (deviceOpened) {
                    bsp.CloseDevice();
                }
            } catch (Exception ex) {
                System.out.println("Erro ao fechar o dispositivo: " + ex.getMessage());
            }
        }
    }

    /**
     * Obtém o ID do último usuário identificado
     */
    public int getUserID() {
        return this.userID;
    }

    /**
     * Fecha a conexão com o dispositivo biométrico de forma segura
     * Deve ser chamado ao final do processamento
     */
    public void closeResources() {
        try {
            // Fecha o dispositivo biométrico se estiver aberto
            bsp.CloseDevice();
            System.out.println("[INFO] Recursos do dispositivo biométrico liberados com sucesso.");
        } catch (Exception e) {
            System.out.println("[ERRO] Falha ao liberar recursos biométricos: " + e.getMessage());
        }
    }

    /**
     * Decodifica o template biométrico armazenado como texto no banco
     * Tenta Base64, depois como texto direto
     */
    private byte[] decodeBiometricTemplate(String templateText) {
        if (templateText == null || templateText.trim().isEmpty()) {
            System.out.println("Template vazio ou nulo");
            return null;
        }

        try {
            // Tenta decodificar como Base64
            byte[] decoded = Base64.getDecoder().decode(templateText);
            System.out.println("Template decodificado de Base64, tamanho: " + decoded.length);
            return decoded;
        } catch (Exception e) {
            System.out.println("Falha ao decodificar Base64: " + e.getMessage());

            try {
                // Se falhar Base64, usa o texto como está
                byte[] rawBytes = templateText.getBytes("UTF-8");
                System.out.println("Usando template como texto direto, tamanho: " + rawBytes.length);
                return rawBytes;
            } catch (Exception e2) {
                System.out.println("Falha ao converter template para bytes: " + e2.getMessage());
                return null;
            }
        }
    }
}
