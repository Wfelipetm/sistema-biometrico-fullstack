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


dotenv.config()
// cleanUpServiceFuncionarios(); 
cleanUpServiceUnidades();

const app = express();
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
app.use('/funci', funcionarioRoutes);
app.use('/reg', registroPontoRoutes);
// app.use('/reg', jwt.validarToken, registroPontoRoutes);
app.use('/unid', unidadeRoutes)
app.use('/auth', authRoutes);
app.use('/relat', gerarRelatorioPontoRoutes);
app.use('/relex', feriasRoutes);
// Servindo imagens do diretório como arquivos estáticos
// app.use('/uploads', express.static(path.join(__dirname, 'upload', 'upFuncionario')));
app.use('/uploads', express.static(path.join(__dirname, 'upload', 'upUnidade')));
app.use('/api', mailRoutes);
app.use('/secre', secretariasRoutes);
app.use('/ferias', feriasRoutes);

app.use('/log', logsRouter);



// Servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
