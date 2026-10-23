import multer from "multer";

const MAX_SIZE_MB = 5;
const ALLOWED_MIMETYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// memoryStorage: multer no escribe nada en disco; deja el archivo completo en
// req.file.buffer y de ahi el controller lo manda directo a Cloudinary.
// El limite de peso es obligatorio: sin el, multer acepta archivos de
// cualquier peso y uno enorme podria acabarse la memoria del server.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024, files: 1 },
  // Sincrono a proposito: el CVE que corrige multer 2.5.0 solo afecta a
  // fileFilter asincronos. El mimetype lo manda el cliente (se puede falsear);
  // la validacion real del contenido la hace Cloudinary al subirlo.
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error("Formato no permitido. Usa una imagen JPG, PNG, WEBP o GIF"));
  },
});

// Recibe la imagen del campo "image" de un form-data.
// Envuelve upload.single() para responder 400 con un mensaje claro: si el
// error siguiera a next(error), el errorHandler responderia 500.
const receiveImage = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const messages = {
        LIMIT_FILE_SIZE: `La imagen no debe pesar más de ${MAX_SIZE_MB} MB`,
        LIMIT_FILE_COUNT: "Solo se puede subir una imagen a la vez",
        LIMIT_UNEXPECTED_FILE: 'La imagen debe enviarse en el campo "image"',
      };
      return res.status(400).json({ message: messages[err.code] || err.message });
    }
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

export default receiveImage;
