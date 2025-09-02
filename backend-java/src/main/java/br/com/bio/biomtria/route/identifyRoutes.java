package br.com.bio.biomtria.route;

import br.com.bio.biomtria.controller.identifyController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;

@RestController
@Configuration
public class identifyRoutes {

    @Autowired
    private identifyController identifyController;

    @GetMapping("/identify")
    public ResponseEntity<?> identifyUserRoute() {
        return identifyController.identifyUser();
    }
}
