const schedule = require('node-schedule');
const fs = require('fs');
const path = require('path');
const db = require('../../config/db');




const cleanUpService = () => {
  schedule.scheduleJob('*/5 * * * * *', async () => {
    const folder = 'upload/upUnidade';
    fs.readdir(folder, async (err, files) => {
      if (err) {
        console.error('Erro ao ler o diretório:', err);
        return;
      }
      try {
        // Obter todos os registros de imagens no banco de dados
        const result = await db.query('SELECT foto FROM unidades');
        const fotosNoBanco = result.rows.map(row => row.foto);

        files.forEach(file => {
          const filePath = path.join(folder, file);
          const stats = fs.statSync(filePath);
          const now = new Date();

          // Verifica se o arquivo é mais antigo que 5 segundos e se não existe no banco de dados
          if ((now - stats.mtime) > 5 * 1000 && !fotosNoBanco.includes(file)) {
            fs.unlinkSync(filePath);
          } else if (!fotosNoBanco.includes(file)) {
            fs.unlinkSync(filePath); 
          } else {
            // console.log(`Arquivo ainda no banco de dados: ${filePath}`);
          }
        });
      } catch (error) {
        console.error('Erro ao acessar o banco de dados:', error.message);
      }
    });
  });
};

module.exports = cleanUpService;
