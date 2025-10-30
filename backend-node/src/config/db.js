const { Pool } = require('pg');

// Configuração da conexão com o PostgreSQL
const pool = new Pool({
  host: '10.200.200.22',
  port: 5432,
  database: 'biometrico',
  user: 'postgres',
  password: 'Aleijado1234',
});

pool.on('connect', () => {
  //console.log('Conectado ao banco de dados PostgreSQL');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
