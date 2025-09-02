package br.com.bio.biomtria.controller;

import br.com.bio.biomtria.service.BiometricService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class identifyController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private BiometricService biometricService;

    public ResponseEntity<?> identifyUser() {
        System.out.println("[DEBUG] Iniciando processo de identificação biométrica...");

        try {
            // Executar identificação biométrica em um bloco try-catch específico
            int userID;
            try {
                userID = biometricService.identifyUserByTemplate(jdbcTemplate);
                System.out.println("[DEBUG] Resultado da identificação: userID=" + userID);
            } catch (Exception e) {
                System.out.println("[ERRO] Exceção durante identificação biométrica: " + e.getMessage());
                e.printStackTrace();
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("message", "Erro na identificação biométrica: " + e.getMessage()));
            }

            if (userID != 0) {
                Map<String, Object> userData;

                // Consultar banco de dados em um bloco try-catch específico
                try {
                    System.out.println("[DEBUG] Consultando dados do usuário no banco: id=" + userID);
                    userData = jdbcTemplate.queryForMap(
                            "SELECT nome, cpf, data_admissao, unidade_id, matricula, cargo FROM funcionarios WHERE id = ?",
                            userID);
                    System.out.println("[DEBUG] Dados retornados: " + userData);
                } catch (Exception e) {
                    System.out.println("[ERRO] Falha ao consultar dados do usuário: " + e.getMessage());
                    e.printStackTrace();
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("message", "Erro ao consultar dados do usuário: " + e.getMessage()));
                }

                String userName = userData.get("nome") != null ? userData.get("nome").toString() : null;
                String cpf = userData.get("cpf") != null ? userData.get("cpf").toString() : null;
                java.sql.Date dataAdmissao = (java.sql.Date) userData.get("data_admissao");
                String dataAdmissaoFormatada = dataAdmissao != null
                        ? new java.text.SimpleDateFormat("dd/MM/yyyy").format(dataAdmissao)
                        : null;
                Integer unidadeId = userData.get("unidade_id") instanceof Integer ? (Integer) userData.get("unidade_id")
                        : null;
                String matricula = userData.get("matricula") != null ? userData.get("matricula").toString() : null;
                String cargo = userData.get("cargo") != null ? userData.get("cargo").toString() : null;

                Map<String, Object> response = new HashMap<>();
                response.put("message", "User identified: " + userName + " (ID: " + userID + ")");
                response.put("cpf", cpf);
                response.put("cargo", cargo);
                response.put("data_admissao", dataAdmissaoFormatada);
                response.put("unidade_id", unidadeId);
                response.put("matricula", matricula);

                System.out.println("[DEBUG] Resposta enviada: " + response);
                return ResponseEntity.ok(response);
            } else {
                System.out.println("[DEBUG] Usuário não identificado pelo template biométrico.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "User not identified"));
            }
        } catch (Exception e) {
            System.out.println("[DEBUG] Erro interno na identificação: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erro interno: " + e.getMessage()));
        } finally {
            // Garante que os recursos do dispositivo biométrico sejam sempre liberados
            try {
                biometricService.closeResources();
                System.out.println("[DEBUG] Recursos biométricos liberados com sucesso no bloco finally.");
            } catch (Exception ex) {
                System.out.println("[ERRO] Falha ao liberar recursos no bloco finally: " + ex.getMessage());
            }
        }
    }
}
