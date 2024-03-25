const multer = require('multer');

const { extname } = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + extname(file.originalname)); 
    }
});

const upload = multer({ storage: storage }).single('csvfile');

module.exports = upload;