package br.com.bio.biomtria.route;

import br.com.bio.biomtria.controller.registerController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

@RestController
@Configuration
public class registerRoutes {
    @PostMapping("/register")
    public ResponseEntity<?> registerUserApiPontoRoute(@RequestBody java.util.Map<String, Object> data) {
        return registerController.registerUser(data);
    }

    @Autowired
    private registerController registerController;

    @PostMapping("/api/ponto/register")
    public ResponseEntity<?> registerUserRoute(@RequestBody java.util.Map<String, Object> data) {
        return registerController.registerUser(data);
    }

    @PostMapping("/update-biometric")
    public ResponseEntity<?> updateBiometricRoute(@RequestBody java.util.Map<String, Object> data) {
        return registerController.updateBiometric(data);
    }

    @GetMapping("/funcionarios-biometric")
    public ResponseEntity<?> listFuncionariosRoute() {
        return registerController.listFuncionariosForBiometric();
    }
}
