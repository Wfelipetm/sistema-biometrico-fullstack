package br.com.bio.biomtria.controller;

import br.com.bio.biomtria.service.BiometricService;
// import br.com.bio.biomtria.jdbcTemplate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

/**
 * Controlador para as operações de ponto eletrônico
 * A rota não é definida aqui, mas sim em pontoRoutes.java
 */
@Component
public class pontoController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private BiometricService biometricService;

    @Autowired
    private RestTemplate restTemplate;

    private static final String EMAIL_API_URL = "http://biometrico.itaguai.rj.gov.br:3001/api/enviar-email";
    private static final String PONTO_API_URL = "http://biometrico.itaguai.rj.gov.br:3001/reg/calcular-registro-ponto";

    /**
     * Método para cadastrar (enroll) uma impressão digital
     * 
     * @param idBiometrico Identificador biométrico a ser associado à digital
     * @return String contendo os dados da impressão digital no formato
     *         TextEncodeFIR
     */
    public ResponseEntity<?> enrollUser(String idBiometrico) {
        try {
            System.out.println("Iniciando cadastro de digital para ID: " + idBiometrico);

            // Captura e exporta o template biométrico real
            byte[] template = biometricService.enrollUserTemplate();

            if (template == null || template.length == 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Falha ao cadastrar impressão digital. Tente novamente."));
            }

            // Salva no banco de dados (campo binário)
            try {
                jdbcTemplate.update(
                        "UPDATE funcionarios SET id_biometrico = ? WHERE id = ?",
                        template, idBiometrico);
            } catch (Exception e) {
                System.out.println("Aviso: Não foi possível salvar a digital no banco: " + e.getMessage());
                // Continua mesmo que não consiga salvar no banco
            }

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Impressão digital cadastrada com sucesso!");
            response.put("id_biometrico", idBiometrico);
            response.put("template_length", template.length);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erro ao cadastrar impressão digital: " + e.getMessage()));
        }
    }

    /**
     * Método auxiliar para envio de e-mail
     */
    private void sendEmail(String subject, String recipient, String body) {
        try {
            Map<String, String> emailRequest = new HashMap<>();
            emailRequest.put("subject", subject);
            emailRequest.put("recipient", recipient);
            emailRequest.put("body", body);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(emailRequest, headers);

            restTemplate.postForEntity(EMAIL_API_URL, entity, String.class);
            System.out.println("E-mail enviado para " + recipient);
        } catch (Exception e) {
            System.out.println("Erro ao enviar e-mail: " + e.getMessage());
        }
    }

    /**
     * Método principal para registro de ponto via biometria
     * A rota é definida na classe pontoRoutes
     */
    public ResponseEntity<?> registerPonto(Map<String, Object> requestData) {
        // ===========================
        // 1. Preparação e validação dos parâmetros
        // ===========================

        // Captura os parâmetros principais enviados pelo terminal
        Object unidadeIdObj = requestData.get("unidade_id");
        Integer unidadeIdTerminal = null;
        if (unidadeIdObj != null) {
            if (unidadeIdObj instanceof Integer) {
                unidadeIdTerminal = (Integer) unidadeIdObj;
            } else {
                try {
                    unidadeIdTerminal = Integer.parseInt(unidadeIdObj.toString());
                } catch (NumberFormatException e) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("message", "unidade_id inválido: " + unidadeIdObj));
                }
            }
        }

        // Formata a data atual se não for fornecida
        String dataRegistro;
        if (requestData.get("data") != null) {
            dataRegistro = (String) requestData.get("data");
        } else {
            dataRegistro = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        }

        // Formata a hora atual se não for fornecida
        String horaEntrada;
        if (requestData.get("hora_entrada") != null) {
            horaEntrada = (String) requestData.get("hora_entrada");
        } else {
            horaEntrada = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        }

        // ===========================
        // 2. Prepara base biométrica temporária
        // ===========================
        try {
            // Limpa base de digitais temporária
            biometricService.clearIndexSearch();

            // Carrega todas as digitais do banco para identificação
            jdbcTemplate.query(
                    "SELECT id_biometrico, id FROM funcionarios",
                    (rs, rowNum) -> {
                        biometricService.addFIRToIndex(rs.getString("id_biometrico"), rs.getInt("id"));
                        return null;
                    });
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erro ao preparar base biométrica: " + e.getMessage()));
        }
        // ===========================
        // 3. Captura e identificação biométrica
        // ===========================
        System.out.println("[DEBUG] Iniciando identificação biométrica...");
        try {
            int funcionarioId = biometricService.identifyUserByTemplate(jdbcTemplate);
            if (funcionarioId == 0) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Digital não reconhecida. Por favor, tente novamente."));
            }

            // ===========================
            // 3. Buscar dados do funcionário no banco
            // ===========================
            Map<String, Object> userData = jdbcTemplate.queryForMap(
                    "SELECT id, nome, cpf, unidade_id, matricula, cargo, id_biometrico, email " +
                            "FROM funcionarios WHERE id = ?",
                    funcionarioId);

            if (userData == null || userData.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Funcionário não encontrado no banco de dados."));
            }

            // Atribui as informações do funcionário a variáveis
            String userName = userData.get("nome") != null ? userData.get("nome").toString() : null;
            Integer unidadeIdFuncionario = userData.get("unidade_id") instanceof Integer
                    ? (Integer) userData.get("unidade_id")
                    : (userData.get("unidade_id") != null ? Integer.parseInt(userData.get("unidade_id").toString())
                            : null);
            String matricula = userData.get("matricula") != null ? userData.get("matricula").toString() : null;
            String idBiometrico = userData.get("id_biometrico") != null ? userData.get("id_biometrico").toString()
                    : null;
            String email = userData.get("email") != null ? userData.get("email").toString() : null;

            // ===========================
            // 4. Validação de unidade (terminal vs funcionário)
            // ===========================
            if (unidadeIdTerminal == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "unidade_id é obrigatório"));
            }

            if (!unidadeIdFuncionario.equals(unidadeIdTerminal)) {
                // Busca nomes das unidades para detalhar o erro
                String unidadeFuncionarioNome = jdbcTemplate.queryForObject(
                        "SELECT nome FROM unidades WHERE id = ?",
                        String.class,
                        unidadeIdFuncionario);

                String unidadeTerminalNome = jdbcTemplate.queryForObject(
                        "SELECT nome FROM unidades WHERE id = ?",
                        String.class,
                        unidadeIdTerminal);

                System.out.printf("[ACESSO NEGADO] Funcionário: %s (ID: %d) | Unidade do funcionário: %s | " +
                        "Unidade do terminal: %s | Data/Hora: %s%n",
                        userName, funcionarioId,
                        unidadeFuncionarioNome != null ? unidadeFuncionarioNome : unidadeIdFuncionario,
                        unidadeTerminalNome != null ? unidadeTerminalNome : unidadeIdTerminal,
                        LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));

                Map<String, Object> response = new HashMap<>();
                response.put("message", "Funcionário não pertence a esta unidade.");
                response.put("funcionario", userName);
                response.put("unidade_funcionario",
                        unidadeFuncionarioNome != null ? unidadeFuncionarioNome : unidadeIdFuncionario);
                response.put("unidade_terminal", unidadeTerminalNome != null ? unidadeTerminalNome : unidadeIdTerminal);

                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            // ===========================
            // 5. Verifica se o funcionário está de férias
            // ===========================
            LocalDate dataAtual = LocalDate.parse(dataRegistro);
            Integer feriasCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM ferias WHERE funcionario_id = ? AND data_inicio <= ? AND data_fim >= ?",
                    Integer.class,
                    funcionarioId, dataAtual, dataAtual);

            if (feriasCount != null && feriasCount > 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Funcionário de férias, você não pode registrar o ponto!"));
            }

            // ===========================
            // 6. Busca escala do funcionário e verifica registros considerando a escala
            // ===========================
            String escala = jdbcTemplate.queryForObject(
                    "SELECT tipo_escala FROM funcionarios WHERE id = ?",
                    String.class,
                    funcionarioId);

            if (escala == null) {
                escala = "8h"; // Escala padrão se não estiver definida
            }

            Map<String, Object> ultimoPontoPendente = null;
            Map<String, Object> ultimoPontoHoje = null;

            // Para escalas de 24h, verifica registros dos últimos 2 dias
            if ("24h".equals(escala) || "24x72".equals(escala)) {
                // Busca último ponto pendente (sem hora de saída) dos últimos 2 dias
                try {
                    ultimoPontoPendente = jdbcTemplate.queryForMap(
                            "SELECT id, hora_entrada, hora_saida, data_hora FROM registros_ponto " +
                                    "WHERE funcionario_id = ? " +
                                    "AND DATE(data_hora) >= ? - INTERVAL '1 day' " +
                                    "AND DATE(data_hora) <= ? " +
                                    "AND hora_saida IS NULL " +
                                    "ORDER BY data_hora DESC LIMIT 1",
                            funcionarioId, dataAtual, dataAtual);
                } catch (Exception e) {
                    // Nenhum registro encontrado
                }

                // Também verifica se já tem registro completo no dia atual
                try {
                    ultimoPontoHoje = jdbcTemplate.queryForMap(
                            "SELECT id, hora_entrada, hora_saida, data_hora FROM registros_ponto " +
                                    "WHERE funcionario_id = ? " +
                                    "AND DATE(data_hora) = ? " +
                                    "ORDER BY data_hora DESC LIMIT 1",
                            funcionarioId, dataAtual);
                } catch (Exception e) {
                    // Nenhum registro encontrado
                }
            } else {
                // Para escalas normais, mantém a lógica atual
                try {
                    ultimoPontoHoje = jdbcTemplate.queryForMap(
                            "SELECT id, hora_entrada, hora_saida, data_hora FROM registros_ponto " +
                                    "WHERE funcionario_id = ? " +
                                    "AND DATE(data_hora) = ? " +
                                    "ORDER BY data_hora DESC LIMIT 1",
                            funcionarioId, dataAtual);

                    // Se tem ponto hoje e hora_saida é nula, é um ponto pendente
                    if (ultimoPontoHoje != null && ultimoPontoHoje.get("hora_saida") == null) {
                        ultimoPontoPendente = ultimoPontoHoje;
                    }
                } catch (Exception e) {
                    // Nenhum registro encontrado
                }
            }

            String mensagem = "";

            // ===========================
            // 7. REGISTRO DE ENTRADA
            // ===========================
            // Se não há ponto pendente E não há registro completo hoje
            if (ultimoPontoPendente == null &&
                    (ultimoPontoHoje == null || ultimoPontoHoje.get("hora_saida") == null)) {

                // Não há registro pendente, registra entrada
                Map<String, Object> payload = new HashMap<>();
                payload.put("funcionario_id", funcionarioId);
                payload.put("unidade_id", unidadeIdTerminal);
                payload.put("data", dataRegistro);
                payload.put("hora_entrada", horaEntrada);
                payload.put("hora_saida", null);
                payload.put("id_biometrico", idBiometrico);

                try {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_JSON);
                    HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

                    // Envia para o sistema de ponto
                    restTemplate.postForEntity(
                            PONTO_API_URL,
                            entity,
                            String.class);
                } catch (Exception e) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("message", "Erro ao registrar ponto no sistema: " + e.getMessage()));
                }

                // Envia e-mail de comprovante de entrada
                LocalDateTime dataHora = LocalDateTime.now();
                mensagem = String.format(
                        "Registro de entrada realizado com sucesso para funcionario: %s\n" +
                                "Comprovante enviado para o e-mail %s",
                        userName, email);

                sendEmail(
                        "Registro de Entrada - Ponto Registrado",
                        email,
                        String.format(
                                "Prezado(a) %s,\n\n" +
                                        "Este e-mail confirma o registro de seu ponto conforme as informações abaixo:\n\n"
                                        +
                                        "Entrada registrada com sucesso.\n\n" +
                                        "Profissional: %s\n" +
                                        "Data/Hora: %s\n\n" +
                                        "Se precisar de suporte ou tiver dúvidas, entre em contato com a Prefeitura de Itaguaí.\n\n"
                                        +
                                        "Atenciosamente,\n" +
                                        "Prefeitura de Itaguaí",
                                userName, userName,
                                dataHora.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"))));

                System.out.printf("[ENTRADA REGISTRADA] Funcionário: %s (ID: %d) | Unidade: %d | Data/Hora: %s %s%n",
                        userName, funcionarioId, unidadeIdTerminal, dataRegistro, horaEntrada);

                // ===========================
                // 8. REGISTRO DE SAÍDA (com bloqueio de 5 minutos)
                // ===========================
            } else if (ultimoPontoPendente != null && ultimoPontoPendente.get("hora_saida") == null) {
                // Há entrada sem saída (pode ser de ontem para escalas 24h), registra saída
                LocalTime horaEntradaTime = LocalTime.parse(ultimoPontoPendente.get("hora_entrada").toString());
                LocalDateTime dataEntrada = LocalDateTime.of(
                        ((java.sql.Timestamp) ultimoPontoPendente.get("data_hora")).toLocalDateTime().toLocalDate(),
                        horaEntradaTime);

                LocalDateTime agora = LocalDateTime.now();
                long tempoDecorridoMinutos = ChronoUnit.MINUTES.between(dataEntrada, agora);

                if (tempoDecorridoMinutos < 5) {
                    int tempoRestante = (int) (5 - tempoDecorridoMinutos);
                    System.out.printf(
                            "[TENTATIVA BLOQUEADA] Funcionário: %s (ID: %d) | Tempo decorrido: %.2f minutos | Tempo restante: %d minuto(s)%n",
                            userName, funcionarioId, (float) tempoDecorridoMinutos, tempoRestante);

                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("message", String.format(
                                    "Você deve aguardar pelo menos 5 minutos após a entrada para registrar a saída. Tempo restante: %d minuto(s).",
                                    tempoRestante)));
                }

                // Se passou mais de 5 minutos, registra a saída
                String horaSaida = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
                LocalDate dataEntradaDate = ((java.sql.Timestamp) ultimoPontoPendente.get("data_hora"))
                        .toLocalDateTime().toLocalDate();

                Map<String, Object> payload = new HashMap<>();
                payload.put("funcionario_id", funcionarioId);
                payload.put("unidade_id", unidadeIdTerminal);
                payload.put("data", dataEntradaDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))); // Usa a data da
                                                                                                        // entrada
                payload.put("hora_entrada", horaEntradaTime.format(DateTimeFormatter.ofPattern("HH:mm:ss")));
                payload.put("hora_saida", horaSaida);
                payload.put("id_biometrico", idBiometrico);

                try {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_JSON);
                    HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

                    // Envia para o sistema de ponto
                    restTemplate.postForEntity(
                            PONTO_API_URL,
                            entity,
                            String.class);
                } catch (Exception e) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("message", "Erro ao registrar ponto no sistema: " + e.getMessage()));
                }

                // Envia e-mail de comprovante de saída
                mensagem = String.format(
                        "Registro de saída realizado com sucesso para funcionario: %s\n" +
                                "Comprovante enviado para o e-mail %s",
                        userName, email);

                sendEmail(
                        "Registro de Saída - Ponto Registrado",
                        email,
                        String.format(
                                "Prezado(a) %s,\n\n" +
                                        "Este e-mail confirma o registro de sua saída conforme as informações abaixo:\n\n"
                                        +
                                        "Saída registrada com sucesso.\n\n" +
                                        "Profissional: %s\n" +
                                        "Data/Hora: %s\n\n" +
                                        "Se precisar de suporte ou tiver dúvidas, entre em contato com a Prefeitura de Itaguaí.\n\n"
                                        +
                                        "Atenciosamente,\n" +
                                        "Prefeitura de Itaguaí",
                                userName, userName,
                                LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"))));

                System.out.printf(
                        "[SAÍDA REGISTRADA] Funcionário: %s (ID: %d) | Unidade: %d | Tempo trabalhado: %.2f minutos%n",
                        userName, funcionarioId, unidadeIdTerminal, (float) tempoDecorridoMinutos);

                // ===========================
                // 9. Caso já tenha registro completo hoje
                // ===========================
            } else if (ultimoPontoHoje != null &&
                    ultimoPontoHoje.get("hora_entrada") != null &&
                    ultimoPontoHoje.get("hora_saida") != null) {

                // Já tem entrada e saída hoje
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", String.format(
                                "Você já bateu sua saída hoje (%s).",
                                dataAtual.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))));

                // ===========================
                // 10. Caso inesperado
                // ===========================
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("message", "Estado do registro de ponto não identificado. Contate o suporte."));
            }

            // Determina o tipo baseado na condição que foi executada
            String tipoRegistro = ultimoPontoPendente == null &&
                    (ultimoPontoHoje == null || ultimoPontoHoje.get("hora_saida") == null) ? "entrada" : "saida";

            // Resposta de sucesso com detalhes do registro
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("message", mensagem);
            responseData.put("funcionario", userName);
            responseData.put("matricula", matricula);
            responseData.put("data_hora", dataRegistro + " " + horaEntrada);
            responseData.put("tipo", tipoRegistro);

            return ResponseEntity.ok(responseData);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erro interno: " + e.getMessage()));
        }
    }
}
