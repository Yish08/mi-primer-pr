import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import connectCloudinary from "./src/config/cloudinary.conf.js";
import connectDB from "./src/config/db.conf.js";
import { swaggerSpec } from "./src/config/swagger.js";
import errorHandler from "./src/middlewares/errorHandler.js";
import logger from "./src/middlewares/logger.js";
import routes from "./src/routes/index.js";

dotenv.config();

// Crea la app de Express con todas sus rutas
const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      credentials: true,
    }),
  );

  app.use(express.json());
  // En los tests no se imprime cada petición
  if (process.env.NODE_ENV !== "test") {
    app.use(logger);
  }

  app.get("/", (req, res) => {
    res.send("API Ecommerce con MongoDB");
  });

  app.use("/api", routes);

  // Por seguridad, la documentación de Swagger (/api-docs) se apaga en producción
  if (process.env.NODE_ENV !== "production") {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }

  app.use((req, res) => {
    res.status(404).json({
      error: "Route not found",
      method: req.method, // GET / POST / PUT ...
      url: req.originalUrl, // http://localhost:4000/...
    });
  });

  // El manejador de errores debe registrarse AL FINAL, despues de las rutas:
  // Express solo lo invoca para los next(error) de middlewares declarados antes.
  app.use(errorHandler);

  return app;
};

const app = createApp();
const port = process.env.PORT || 4000;

if (process.env.NODE_ENV !== "test") {
  connectDB();
  connectCloudinary();
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

export { createApp };
export default app;
