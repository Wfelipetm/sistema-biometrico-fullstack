const { Pool } = require('pg');

// Configuração da conexão com o PostgreSQL
const pool = new Pool({
  host: 'biometrico.itaguai.rj.gov.br',
  port: 5432,
  database: 'biometrico',
  user: 'postgres',
  password: 'B10m3Tr1@',
});

pool.on('connect', () => {
  //console.log('Conectado ao banco de dados PostgreSQL');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
