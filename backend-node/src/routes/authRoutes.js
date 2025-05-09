const express = require('express');
const { cadastrarUsuario, loginUsuario, atualizarUsuario, buscarUsuarios, deletarUsuario } = require('../controllers/authController');
const jwt = require('../middleware/authMiddleware');




const router = express.Router();

router.post('/cadastro', cadastrarUsuario);
router.post('/login', loginUsuario);



router.get('/usuarios', jwt.validarToken, buscarUsuarios);
router.put('/atualizar/:id', jwt.validarToken, atualizarUsuario);
router.delete('/deletar/:id', jwt.validarToken, deletarUsuario);




module.exports = router;
