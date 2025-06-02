const db = require('../config/db');
const { format } = require('date-fns');

module.exports = {
  // async criarFuncionario(req, res) {
  //   const {
  //     nome,
  //     cpf,
  //     cargo,
  //     data_admissao,
  //     id_biometrico,
  //     unidade_id,
  //     matricula,
  //     tipo_escala,
  //     telefone,
  //     email
  //   } = req.body;

  //   try {
  //     if (!id_biometrico || id_biometrico.trim() === "") {
  //       return res.status(400).json({ error: 'O token biométrico é obrigatório.' });
  //     }

  //     const tokenRegex = /^[A-Za-z0-9\*\/]+$/;
  //     if (!tokenRegex.test(id_biometrico)) {
  //       return res.status(400).json({ error: 'Token biométrico inválido.' });
  //     }

  //     const cpfExistente = await db.query('SELECT id FROM funcionarios WHERE cpf = $1', [cpf]);
  //     if (cpfExistente.rows.length > 0) {
  //       return res.status(400).json({ error: 'CPF já cadastrado no sistema.' });
  //     }

  //     const result = await db.query(
  //       `INSERT INTO funcionarios (
  //         nome, cpf, cargo, data_admissao,
  //         id_biometrico, unidade_id, matricula,
  //         tipo_escala, telefone, email
  //       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
  //       RETURNING *`,
  //       [
  //         nome.toUpperCase(),
  //         cpf,
  //         cargo.toUpperCase(),
  //         data_admissao,
  //         id_biometrico,
  //         unidade_id,
  //         matricula,
  //         tipo_escala,
  //         telefone,
  //         email
  //       ]
  //     );

  //     res.status(201).json(result.rows[0]);
  //   } catch (error) {
  //     console.error('Erro ao criar funcionário:', error.message);
  //     res.status(500).json({ error: 'Erro interno no servidor. Por favor, tente novamente mais tarde.' });
  //   }
  // }
  // ,

  async listarFuncionarios(req, res) {
    try {
      const { nome, cargo, unidade_id } = req.query;
      let query = `
        SELECT id, nome, cpf, cargo, unidade_id, data_admissao, id_biometrico, matricula, created_at
        FROM funcionarios`;

      const conditions = [];
      const values = [];
      if (nome) {
        conditions.push(`nome ILIKE $${conditions.length + 1}`);
        values.push(`%${nome}%`);
      }
      if (cargo) {
        conditions.push(`cargo ILIKE $${conditions.length + 1}`);
        values.push(`%${cargo}%`);
      }
      if (unidade_id) {
        conditions.push(`unidade_id = $${conditions.length + 1}`);
        values.push(unidade_id);
      }
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      const result = await db.query(query, values);
      const funcionarios = result.rows.map((funcionario) => ({
        ...funcionario,
        data_admissao: format(new Date(funcionario.data_admissao), 'dd/MM/yyyy')
      }));

      res.status(200).json(funcionarios);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async atualizarFuncionario(req, res) {
    const { id } = req.params;
    const {
      nome,
      cpf,
      cargo,
      data_admissao,
      unidade_id,
      matricula,
      tipo_escala,
      telefone
    } = req.body;

    try {
      const result = await db.query(
        `UPDATE funcionarios
         SET nome = $1,
             cpf = $2,
             cargo = $3,
             data_admissao = $4,
             unidade_id = $5,
             matricula = $6,
             tipo_escala = $7,
             telefone = $8,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $9
         RETURNING *`,
        [
          nome,
          cpf,
          cargo,
          data_admissao,
          unidade_id,
          matricula,
          tipo_escala,
          telefone,
          id
        ]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Funcionário não encontrado" });
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  ,




  async listarFuncionariosPorUnidade(req, res) {
    const { unidadeId } = req.params;
    const { limit = 10, offset = 0 } = req.query; // Pegando os parâmetros limit e offset da query string

    try {
      const unidadeResult = await db.query('SELECT id FROM unidades WHERE id = $1', [unidadeId]);
      if (unidadeResult.rowCount === 0) {
        return res.status(404).json({ error: `Unidade com ID ${unidadeId} não encontrada.` });
      }

      const funcionariosResult = await db.query(
        `SELECT id, nome, cpf, cargo, data_admissao, id_biometrico, matricula, tipo_escala, telefone, email 
         FROM funcionarios 
         WHERE unidade_id = $1
         LIMIT $2 OFFSET $3`,
        [unidadeId, limit, offset] // Passando os parâmetros de limite e offset para a query
      );

      if (funcionariosResult.rowCount === 0) {
        return res.status(404).json({ error: `Nenhum funcionário encontrado para a unidade com ID ${unidadeId}.` });
      }

      res.status(200).json(funcionariosResult.rows);
    } catch (error) {
      console.error('Erro ao listar funcionários:', error.message);
      res.status(500).json({ error: error.message });
    }
  },


  async obterFuncionarioPorId(req, res) {
    const { id } = req.params;
    try {
      const result = await db.query(
        `SELECT * FROM funcionarios WHERE id = $1`,
        [id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Funcionário não encontrado." });
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error("Erro ao buscar funcionário por ID:", error.message);
      res.status(500).json({ error: "Erro interno no servidor. Por favor, tente novamente mais tarde." });
    }
  },






  async excluirFuncionario(req, res) {
    const { id } = req.params;
    try {
      const result = await db.query('DELETE FROM funcionarios WHERE id = $1 RETURNING *', [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Funcionário não encontrado' });
      }
      res.status(200).json({ message: 'Funcionário excluído com sucesso' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
