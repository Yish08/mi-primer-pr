import { v2 as cloudinary } from "cloudinary";

// Se llama desde server.js DESPUES de dotenv.config(), igual que connectDB.
// Con ES modules todos los imports se ejecutan antes que el codigo de
// server.js: si leyeramos process.env aqui arriba (fuera de la funcion),
// las variables del .env todavia estarian en undefined.
const connectCloudinary = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    // La tienda sigue funcionando; solo POST /api/upload respondera error
    console.error("Cloudinary not configured: missing variables in .env");
    return;
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
  console.log(`Cloudinary configured ${CLOUDINARY_CLOUD_NAME}`);
};

// Instancia ya configurada (el SDK guarda la configuracion de forma global)
export { cloudinary };
export default connectCloudinary;
