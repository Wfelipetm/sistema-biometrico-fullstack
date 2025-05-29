// routes/logs.js
const express = require('express');
const router = express.Router();
const registrarLog = require('../controllers/logsController');

router.post('/logs', registrarLog.registrarLog);

module.exports = router;