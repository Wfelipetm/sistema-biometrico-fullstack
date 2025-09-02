package br.com.bio.biomtria.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/**
 * Configuração CORS para permitir requisições do domínio da prefeitura
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // Permite credenciais (cookies, authorization headers, etc)
        config.setAllowCredentials(true);

        // Domínio permitido
        config.addAllowedOrigin("https://prefeitura.itaguai.rj.gov.br");

        // Métodos HTTP permitidos
        config.addAllowedMethod("*");

        // Headers permitidos
        config.addAllowedHeader("*");

        // Expõe headers na resposta
        config.addExposedHeader("Authorization");

        // Aplica a configuração para todas as rotas
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}
