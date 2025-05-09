const multer = require('multer');
const path = require('path');

const mime = require('mime-types');

// Configuração do armazenamento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'upload/upUnidade');
    },
    filename: (req, file, cb) => {
        const ext = mime.extension(file.mimetype); 
        const filename = `${Date.now()}${Math.round(Math.random() * 1E9)}.${ext}`;
        cb(null, filename);
    },
});

// Validação do tipo de arquivo
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Tipo de arquivo não permitido! Somente imagens (JPEG, PNG, GIF).'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;
