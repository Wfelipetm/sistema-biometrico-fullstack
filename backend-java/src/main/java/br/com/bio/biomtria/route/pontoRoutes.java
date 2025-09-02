package br.com.bio.biomtria.route;

import br.com.bio.biomtria.controller.pontoController;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;

/**
 * Configuração de rotas para o módulo de ponto eletrônico
 * Esta classe configura as rotas de forma mais clara e explícita
 */
@Configuration
@RestController
public class pontoRoutes {

    private final pontoController controller;

    /**
     * Construtor que recebe o controlador via injeção de dependência
     */
    public pontoRoutes(pontoController controller) {
        this.controller = controller;
        System.out.println("Rotas do módulo de ponto configuradas com sucesso!");
    }

    /**
     * Rota para registro de ponto
     * Equivalente a app.add_url_rule('/register_ponto', 'register_ponto',
     * register_ponto, methods=['POST'])
     */
    @PostMapping("/register_ponto")
    public ResponseEntity<?> registerPontoRoute(@RequestBody Map<String, Object> requestData) {
        return controller.registerPonto(requestData);
    }

    /**
     * Rota para cadastro (enroll) de impressão digital
     * Equivalente a app.add_url_rule('/enroll_user', 'enroll_user', enroll_user,
     * methods=['POST'])
     */
    @PostMapping("/api/ponto/enroll")
    public ResponseEntity<?> enrollUserRoute(@RequestBody Map<String, Object> requestData) {
        String idBiometrico = requestData.get("id_biometrico") != null ? requestData.get("id_biometrico").toString()
                : null;

        if (idBiometrico == null || idBiometrico.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "O parâmetro id_biometrico é obrigatório"));
        }

        return controller.enrollUser(idBiometrico);
    }

    /**
     * Endpoint de teste para verificar se a API está respondendo
     */
    @PostMapping("/api/ponto/teste")
    public ResponseEntity<?> testeApi(@RequestBody(required = false) Map<String, Object> requestData) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ok");
        response.put("message", "API de ponto está funcionando!");
        response.put("data", requestData != null ? requestData : "Nenhum dado enviado");
        return ResponseEntity.ok(response);
    }
}
