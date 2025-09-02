@echo off
REM Script para converter certificados PEM para keystore PKCS12 ou criar um certificado auto-assinado

echo =================================================
echo      Configuracao de HTTPS para Spring Boot
echo =================================================
echo.
echo Este script oferece duas opcoes:
echo 1. Usar certificados PEM existentes (cert1.pem e privkey1.pem)
echo 2. Criar um novo certificado auto-assinado para testes
echo.

set /p OPCAO="Digite 1 ou 2 para escolher uma opcao: "

if "%OPCAO%"=="1" goto USAR_EXISTENTES
if "%OPCAO%"=="2" goto CRIAR_NOVO
echo Opcao invalida.
goto FIM

:CRIAR_NOVO
echo.
echo Criando um certificado auto-assinado para testes...
echo.

REM Verificar se o OpenSSL está disponível
where openssl >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo OpenSSL nao encontrado. Por favor, instale o OpenSSL.
    echo Download: https://slproweb.com/products/Win32OpenSSL.html
    goto FIM
)

REM Criar diretório para o keystore se não existir
if not exist "C:\https" mkdir "C:\https"

REM Criar certificado auto-assinado
set /p SENHA="Digite uma senha para o keystore: "
echo.
echo Gerando certificado auto-assinado...
openssl req -x509 -newkey rsa:4096 -keyout "C:\https\privkey1.pem" -out "C:\https\cert1.pem" -days 365 -nodes -subj "/CN=localhost"

REM Converter para PKCS12
openssl pkcs12 -export -in "C:\https\cert1.pem" -inkey "C:\https\privkey1.pem" -out "C:\https\keystore.p12" -name tomcat -password pass:%SENHA%

echo.
echo Certificado auto-assinado criado em:
echo - C:\https\cert1.pem 
echo - C:\https\privkey1.pem
echo - C:\https\keystore.p12
goto CONFIG_APP

:USAR_EXISTENTES
echo.
echo Usando certificados PEM existentes...
echo.

REM Verificar se o OpenSSL está disponível
where openssl >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo OpenSSL nao encontrado. Por favor, instale o OpenSSL.
    echo Download: https://slproweb.com/products/Win32OpenSSL.html
    goto FIM
)

REM Verificar se os arquivos existem
if not exist "C:\https\cert1.pem" (
    echo Arquivo C:\https\cert1.pem nao encontrado!
    goto FIM
)
if not exist "C:\https\privkey1.pem" (
    echo Arquivo C:\https\privkey1.pem nao encontrado!
    goto FIM
)

REM Criar diretório para o keystore se não existir
if not exist "C:\https" mkdir "C:\https"

set /p SENHA="Digite uma senha para o keystore: "
echo.
echo Convertendo certificados para formato PKCS12...

REM Verificar se existe chain1.pem
if exist "C:\https\chain1.pem" (
    openssl pkcs12 -export -in "C:\https\cert1.pem" -inkey "C:\https\privkey1.pem" -out "C:\https\keystore.p12" -name tomcat -CAfile "C:\https\chain1.pem" -caname root -password pass:%SENHA%
) else (
    openssl pkcs12 -export -in "C:\https\cert1.pem" -inkey "C:\https\privkey1.pem" -out "C:\https\keystore.p12" -name tomcat -password pass:%SENHA%
)

:CONFIG_APP
echo.
echo Keystore criado com sucesso em C:\https\keystore.p12
echo.
echo Deseja atualizar o arquivo application.properties? (s/n)
set /p ATUALIZAR="> "

if /i "%ATUALIZAR%"=="s" (
    echo.
    echo Atualizando application.properties...
    
    REM Descomente as linhas de configuração HTTPS
    powershell -Command "(Get-Content -Path 'src\main\resources\application.properties') -replace '# server.port=8443', 'server.port=8443' -replace '# server.ssl.enabled=true', 'server.ssl.enabled=true' -replace '# server.ssl.key-store=file:C:/https/keystore.p12', 'server.ssl.key-store=file:C:/https/keystore.p12' -replace '# server.ssl.key-store-password=sua_senha_aqui', 'server.ssl.key-store-password=%SENHA%' -replace '# server.ssl.key-store-type=PKCS12', 'server.ssl.key-store-type=PKCS12' -replace '# server.ssl.key-alias=tomcat', 'server.ssl.key-alias=tomcat' | Set-Content -Path 'src\main\resources\application.properties'"
    
    echo Arquivo application.properties atualizado com a senha do keystore.
) else (
    echo.
    echo Para habilitar o HTTPS, edite o arquivo application.properties manualmente:
    echo - Descomente as linhas de configuracao HTTPS
    echo - Atualize server.ssl.key-store-password com: %SENHA%
)

echo.
echo ====================================================
echo Configuracao concluida! Para iniciar a aplicacao:
echo - Execute: .\mvnw spring-boot:run
echo - Acesse: https://localhost:8443
echo ====================================================

:FIM
echo.
echo Pressione qualquer tecla para sair...
pause > nul
