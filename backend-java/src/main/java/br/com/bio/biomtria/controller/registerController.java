package br.com.bio.biomtria.controller;

import br.com.bio.biomtria.service.BiometricService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class registerController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private BiometricService biometricService;

    private static final List<String> TIPO_ESCALA_VALIDOS = Arrays.asList("8h", "12h", "16h", "24h", "12x36", "24x72",
            "32h", "20h");

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, Object> data) {
        String userName = String.valueOf(data.get("userName"));
        String cpf = String.valueOf(data.get("cpf"));
        String cargo = data.get("cargo") != null ? data.get("cargo").toString() : "";
        String matricula = String.valueOf(data.get("matricula"));
        String unidadeId = String.valueOf(data.get("unidade_id"));
        String dataAdmissao = String.valueOf(data.get("data_admissao"));
        String tipoEscala = data.get("tipo_escala") != null ? data.get("tipo_escala").toString() : null;
        String telefone = String.valueOf(data.get("telefone"));
        String email = String.valueOf(data.get("email"));

        // Converter a data de admissão para um objeto java.sql.Date
        java.sql.Date dataAdmissaoSql = null;
        try {
            if (dataAdmissao != null && !dataAdmissao.equals("null")) {
                java.time.LocalDate localDate = java.time.LocalDate.parse(dataAdmissao);
                dataAdmissaoSql = java.sql.Date.valueOf(localDate);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Formato de data inválido. Use o formato YYYY-MM-DD."));
        }

        if (tipoEscala == null || !TIPO_ESCALA_VALIDOS.contains(tipoEscala)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message",
                            "Tipo de escala inválido. Valores válidos: " + String.join(", ", TIPO_ESCALA_VALIDOS)));
        }
        if (email == null || email.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Email é obrigatório."));
        }

        String idBiometrico;
        try {
            // Enroll biometria usando a matrícula
            byte[] template = biometricService.enrollUserTemplate();
            idBiometrico = template != null ? Base64.getEncoder().encodeToString(template) : null;
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erro durante o registro biométrico: " + e.getMessage()));
        }

        // Verifica duplicidade
        List<Map<String, Object>> existingUsers = jdbcTemplate.queryForList(
                "SELECT * FROM funcionarios WHERE " +
                        "(id_biometrico = ?) OR " +
                        "cpf = ? OR " +
                        "email = ? OR " +
                        "CAST(matricula AS TEXT) = ? OR " +
                        "nome = ?",
                idBiometrico, cpf, email, matricula, userName);
        if (!existingUsers.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "User ID, CPF, Email, Matrícula ou Nome já existe"));
        }
        List<Map<String, Object>> existingMatricula = jdbcTemplate.queryForList(
                "SELECT * FROM funcionarios WHERE CAST(matricula AS TEXT) = ?", matricula);
        if (!existingMatricula.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Matrícula already exists"));
        }

        // Convert matricula to integer if possible
        Integer matriculaInt = null;
        try {
            matriculaInt = Integer.parseInt(matricula);
        } catch (NumberFormatException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Matrícula deve ser um número inteiro"));
        }

        // Convert unidade_id to integer if possible
        Integer unidadeIdInt = null;
        try {
            unidadeIdInt = Integer.parseInt(unidadeId);
        } catch (NumberFormatException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Unidade ID deve ser um número inteiro"));
        }

        jdbcTemplate.update(
                "INSERT INTO funcionarios (nome, cpf, cargo, id_biometrico, unidade_id, matricula, tipo_escala, telefone, email, data_admissao, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?::tipo_escala_enum, ?, ?, ?, CURRENT_DATE, CURRENT_DATE)",
                userName, cpf, cargo, idBiometrico, unidadeIdInt, matriculaInt, tipoEscala, telefone, email,
                dataAdmissaoSql);

        Map<String, Object> registeredUser = jdbcTemplate.queryForMap(
                "SELECT * FROM funcionarios WHERE matricula = ?", matriculaInt);

        Map<String, Object> user = new HashMap<>();
        user.put("id", registeredUser.get("id"));
        user.put("nome", registeredUser.get("nome"));
        user.put("cpf", registeredUser.get("cpf"));
        user.put("cargo", registeredUser.get("cargo"));
        user.put("data_admissao", registeredUser.get("data_admissao"));
        user.put("id_biometrico", registeredUser.get("id_biometrico"));
        user.put("unidade_id", registeredUser.get("unidade_id"));
        user.put("matricula", registeredUser.get("matricula"));
        user.put("tipo_escala", registeredUser.get("tipo_escala"));
        user.put("telefone", registeredUser.get("telefone"));
        user.put("email", registeredUser.get("email"));
        user.put("created_at", registeredUser.get("created_at"));
        user.put("updated_at", registeredUser.get("updated_at"));

        return ResponseEntity.ok(Map.of("message", "User registered successfully", "user", user));
    }

    @PostMapping("/update-biometric")
    public ResponseEntity<?> updateBiometric(@RequestBody Map<String, Object> data) {
        Object funcionarioIdObj = data.get("funcionario_id");
        Object matriculaObj = data.get("matricula");
        if (funcionarioIdObj == null && matriculaObj == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "É necessário fornecer funcionario_id ou matricula"));
        }
        Map<String, Object> funcionario;
        if (funcionarioIdObj != null) {
            List<Map<String, Object>> result = jdbcTemplate.queryForList(
                    "SELECT id, nome, matricula, id_biometrico FROM funcionarios WHERE id = ?", funcionarioIdObj);
            if (result.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Funcionário não encontrado"));
            }
            funcionario = result.get(0);
        } else {
            List<Map<String, Object>> result = jdbcTemplate.queryForList(
                    "SELECT id, nome, matricula, id_biometrico FROM funcionarios WHERE matricula = ?", matriculaObj);
            if (result.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Funcionário não encontrado"));
            }
            funcionario = result.get(0);
        }
        Integer funcId = (Integer) funcionario.get("id");
        String nome = (String) funcionario.get("nome");
        String matriculaFunc = (String) funcionario.get("matricula");
        String idBiometricoAntigo = (String) funcionario.get("id_biometrico");

        try {
            byte[] novoTemplate = biometricService.enrollUserTemplate();
            String novoIdBiometrico = novoTemplate != null ? Base64.getEncoder().encodeToString(novoTemplate) : null;
            List<Map<String, Object>> conflito = jdbcTemplate.queryForList(
                    "SELECT id, nome FROM funcionarios WHERE id_biometrico = ? AND id != ?", novoIdBiometrico, funcId);
            if (!conflito.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Este ID biométrico já está sendo usado por outro funcionário: "
                                + conflito.get(0).get("nome")));
            }
            jdbcTemplate.update(
                    "UPDATE funcionarios SET id_biometrico = ?, updated_at = CURRENT_DATE WHERE id = ?",
                    novoIdBiometrico, funcId);
            Map<String, Object> funcionarioAtualizado = jdbcTemplate.queryForMap(
                    "SELECT * FROM funcionarios WHERE id = ?", funcId);
            Map<String, Object> funcionarioResp = new HashMap<>();
            funcionarioResp.put("id", funcionarioAtualizado.get("id"));
            funcionarioResp.put("nome", funcionarioAtualizado.get("nome"));
            funcionarioResp.put("cpf", funcionarioAtualizado.get("cpf"));
            funcionarioResp.put("cargo", funcionarioAtualizado.get("cargo"));
            funcionarioResp.put("data_admissao", funcionarioAtualizado.get("data_admissao"));
            funcionarioResp.put("id_biometrico_antigo", idBiometricoAntigo);
            funcionarioResp.put("id_biometrico_novo", funcionarioAtualizado.get("id_biometrico"));
            funcionarioResp.put("unidade_id", funcionarioAtualizado.get("unidade_id"));
            funcionarioResp.put("matricula", funcionarioAtualizado.get("matricula"));
            funcionarioResp.put("tipo_escala", funcionarioAtualizado.get("tipo_escala"));
            funcionarioResp.put("telefone", funcionarioAtualizado.get("telefone"));
            funcionarioResp.put("email", funcionarioAtualizado.get("email"));
            funcionarioResp.put("updated_at", funcionarioAtualizado.get("updated_at"));
            return ResponseEntity.ok(
                    Map.of("message", "Biometria atualizada com sucesso para " + nome, "funcionario", funcionarioResp));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erro ao atualizar biometria: " + e.getMessage()));
        }
    }

    @GetMapping("/funcionarios-biometric")
    public ResponseEntity<?> listFuncionariosForBiometric() {
        List<Map<String, Object>> funcionarios = jdbcTemplate.queryForList(
                "SELECT f.id, f.nome, f.matricula, f.cargo, u.nome as unidade_nome, f.id_biometrico FROM funcionarios f LEFT JOIN unidades u ON f.unidade_id = u.id ORDER BY f.nome");
        List<Map<String, Object>> funcionariosList = new ArrayList<>();
        for (Map<String, Object> func : funcionarios) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", func.get("id"));
            item.put("nome", func.get("nome"));
            item.put("matricula", func.get("matricula"));
            item.put("cargo", func.get("cargo"));
            item.put("unidade", func.get("unidade_nome"));
            item.put("id_biometrico", func.get("id_biometrico"));
            funcionariosList.add(item);
        }
        return ResponseEntity.ok(Map.of("funcionarios", funcionariosList));
    }
}
