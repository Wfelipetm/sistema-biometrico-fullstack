@echo off
echo Criando pasta C:\https se nao existir...
if not exist "C:\https" mkdir "C:\https"

echo.
echo Por favor, copie seus arquivos de certificado para C:\https:
echo - cert1.pem  (certificado)
echo - privkey1.pem (chave privada)
echo - chain1.pem (cadeia de certificados, opcional)
echo.
echo Pressione qualquer tecla quando os arquivos estiverem prontos...
pause > nul

echo.
echo Verificando arquivos de certificado...
if not exist "C:\https\cert1.pem" (
    echo ERRO: Arquivo cert1.pem nao encontrado em C:\https
    goto ERRO
)
if not exist "C:\https\privkey1.pem" (
    echo ERRO: Arquivo privkey1.pem nao encontrado em C:\https
    goto ERRO
)

echo.
echo Convertendo certificados para formato PKCS12 sem senha...
echo (Se aparecer algum prompt, digite 'yes' para continuar)

if exist "C:\https\chain1.pem" (
    openssl pkcs12 -export -in "C:\https\cert1.pem" -inkey "C:\https\privkey1.pem" -out "C:\https\keystore.p12" -name tomcat -CAfile "C:\https\chain1.pem" -caname root -passout pass:
) else (
    openssl pkcs12 -export -in "C:\https\cert1.pem" -inkey "C:\https\privkey1.pem" -out "C:\https\keystore.p12" -name tomcat -passout pass:
)

if not exist "C:\https\keystore.p12" (
    echo ERRO: Falha ao criar o keystore.p12
    goto ERRO
)

echo.
echo Keystore criado com sucesso em C:\https\keystore.p12
echo.
echo Configuracao HTTPS concluida!
echo.
echo Para iniciar a aplicacao, execute:
echo .\mvnw spring-boot:run
echo.
echo Sua aplicacao estara disponivel em:
echo https://localhost:8443/identify
echo.
goto FIM

:ERRO
echo.
echo Configuracao HTTPS falhou!
echo.

:FIM
echo Pressione qualquer tecla para sair...
pause > nul
