const express = require('express');
const bodyParser = require('body-parser');
const funcionarioRoutes = require('./src/routes/funcionarioRoutes');
const registroPontoRoutes = require('./src/routes/registroPontoRoutes');
const unidadeRoutes = require('./src/routes/unidadeRoutes');
const authRoutes = require('./src/routes/authRoutes')
const gerarRelatorioPontoRoutes = require('./src/routes/gerarRelatorioPontoRoutes')
const feriasRoutes = require('./src/routes/feriasRoutes')
const mailRoutes = require('./src/routes/mail');
const secretariasRoutes = require('./src/routes/secretariasRoutes');
const logsRouter = require('./src/routes/logsRoutes')

const dotenv = require("dotenv")
const jwt = require('./src/middleware/authMiddleware');
//const cleanUpServiceFuncionarios = require('./src/service/limpezaFotos/servicodeLimpezaImg');
const cleanUpServiceUnidades = require('./src/service/limpezaFotos/servicodeLimpezaImgUnidade');
const cors = require('cors')
const path = require('path');

// Importar Passport e estratégia LDAP
const passport = require('passport');
const LdapStrategy = require('passport-ldapauth');

dotenv.config()



// Configuração LDAP do Passport
passport.use(
  new LdapStrategy({
    server: {
      url: process.env.LDAP_URL,
      bindDN: process.env.LDAP_BIND_DN,
      bindCredentials: process.env.LDAP_BIND_CREDENTIALS,
      searchBase: process.env.LDAP_SEARCH_BASE,
      searchFilter: process.env.LDAP_SEARCH_FILTER,
      searchAttributes: ['sAMAccountName', 'cn', 'mail', 'memberOf', 'description', 'department', 'dn'],
      tlsOptions: {
        rejectUnauthorized: false
      }
    },
    usernameField: 'username',
    passwordField: 'password'
  })
);


// cleanUpServiceFuncionarios(); 
cleanUpServiceUnidades();

const app = express();
app.set('trust proxy', true);
app.use(cors())
const PORT = process.env.PORT || 5000;


// Aplica bodyParser.json() só em métodos com corpo (POST, PUT, PATCH)
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    bodyParser.json()(req, res, next);
  } else {
    next();
  }
});



//rotas
app.use('/auth', authRoutes);
app.use('/api', mailRoutes);
app.use('/reg', registroPontoRoutes);
app.use('/unid', jwt.validarToken, unidadeRoutes)
app.use('/relat', jwt.validarToken, gerarRelatorioPontoRoutes);
app.use('/relex', jwt.validarToken, feriasRoutes);
app.use('/secre', jwt.validarToken, secretariasRoutes);
app.use('/ferias', jwt.validarToken, feriasRoutes);
app.use('/funci', jwt.validarToken, funcionarioRoutes);
app.use('/log', jwt.validarToken, logsRouter);
app.use('/uploads', express.static(path.join(__dirname, 'upload', 'upUnidade')));


// Servidor
const server = app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});