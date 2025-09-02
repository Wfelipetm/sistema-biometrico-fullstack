package br.com.bio.biomtria;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = { "br.com.bio.biomtria", "br.com.bio.biomtria.controller", "br.com.bio.biomtria.route",
        "br.com.bio.biomtria.service", "br.com.bio.biomtria.config" })
public class BiometriaApplication {

    public static void main(String[] args) {
        SpringApplication.run(BiometriaApplication.class, args);
        System.out.println("Aplicação de Biometria iniciada com sucesso!");
    }
}
