package br.com.bio.biomtria.config;

import org.apache.catalina.connector.Connector;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.servlet.server.ServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuração HTTPS e redirecionamento HTTP para HTTPS
 * Usando keystore PKCS12 padrão do Spring Boot
 */
@Configuration
@ConditionalOnProperty(name = "server.ssl.enabled", havingValue = "true")
public class HttpsConfig {

    // Porta HTTP para redirecionamento (opcional)
    @Value("${server.http.port:8080}")
    private int httpPort;

    // Porta HTTPS configurada no application.properties
    @Value("${server.port:5000}")
    private int httpsPort;

    /**
     * Configuração do servidor Tomcat com suporte a HTTP e HTTPS
     * O HTTP será redirecionado para HTTPS
     */
    @Bean
    public ServletWebServerFactory servletContainer() {
        TomcatServletWebServerFactory tomcat = new TomcatServletWebServerFactory();

        // Adiciona conector HTTP para redirecionamento (opcional)
        tomcat.addAdditionalTomcatConnectors(createStandardConnector());

        // Configurações específicas para resolver o problema BAD_PACKET_LENGTH
        tomcat.addConnectorCustomizers(connector -> {
            // Timeouts mais curtos para forçar reconexão em caso de problemas
            connector.setProperty("connectionTimeout", "10000");
            connector.setProperty("maxKeepAliveRequests", "50");
            connector.setProperty("keepAliveTimeout", "15000");

            // Configurações de buffer
            connector.setProperty("maxPostSize", "10485760"); // 10MB
            connector.setProperty("maxSavePostSize", "10485760"); // 10MB

            // Configurações de SSL mais restritas
            connector.setProperty("sslEnabledProtocols", "TLSv1.2");
            connector.setProperty("sslProtocol", "TLSv1.2");
            connector.setProperty("clientAuth", "false");
            connector.setProperty("secure", "true");

            // Diminuir o tempo limite de sessão
            connector.setProperty("sessionTimeout", "1");

            // Desativar Linger para encerrar conexões imediatamente
            connector.setProperty("soLingerOn", "false");

            // Desativar Keep-Alive persistente para forçar novas conexões
            connector.setProperty("tcpNoDelay", "true");
            connector.setProperty("useKeepAliveResponseHeader", "false");
        });

        return tomcat;
    }

    /**
     * Cria um conector HTTP padrão para redirecionamento para HTTPS
     */
    private Connector createStandardConnector() {
        Connector connector = new Connector(TomcatServletWebServerFactory.DEFAULT_PROTOCOL);
        connector.setPort(httpPort);
        connector.setSecure(false);
        connector.setRedirectPort(httpsPort); // Usa a porta HTTPS configurada

        // Configurações de timeout para evitar problemas de conexão
        connector.setProperty("connectionTimeout", "10000");
        connector.setProperty("keepAliveTimeout", "15000");
        connector.setProperty("maxKeepAliveRequests", "50");
        connector.setProperty("useKeepAliveResponseHeader", "false");
        connector.setProperty("maxConnections", "5000");
        connector.setProperty("acceptCount", "100");

        return connector;
    }
}
