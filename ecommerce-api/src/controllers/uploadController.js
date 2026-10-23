import { cloudinary } from "../config/cloudinary.conf.js";

// Carpeta donde se ven las imagenes en la consola de Cloudinary.
// Las cuentas nuevas usan "dynamic folders": ahi se usa asset_folder
// (el parametro folder esta deprecado en ese modo).
const PRODUCTS_FOLDER = "ecommerce/products";

// upload_stream no devuelve una promesa sino un stream: se envuelve en una
// Promise para poder usar await. El buffer viene de multer (memoryStorage).
const uploadBuffer = (buffer, options) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(options, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      })
      .end(buffer);
  });

// POST /api/upload (form-data con el campo "image")
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: 'No se recibió ninguna imagen en el campo "image"' });
    }

    const result = await uploadBuffer(req.file.buffer, {
      resource_type: "image",
      asset_folder: PRODUCTS_FOLDER,
      // Cloudinary revisa el contenido real del archivo y rechaza otros formatos
      allowed_formats: ["jpg", "png", "webp", "gif"],
    });

    res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (error) {
    // 400 de Cloudinary: el archivo no es una imagen valida o su formato no
    // esta permitido. Cualquier otro error (credenciales, red) es del server.
    if (error.http_code === 400) {
      return res.status(400).json({
        message: "El archivo no es una imagen válida (JPG, PNG, WEBP o GIF)",
      });
    }
    next(error);
  }
};

export { uploadImage };
