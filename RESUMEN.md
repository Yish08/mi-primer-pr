# Variables de Entorno para Despliegue a Producción (`RESUMEN.md`)

Se extrajeron a variables de entorno las URLs que estaban fijas a `localhost` tanto en el **frontend** como en el **backend**, conservando sus valores por defecto para que el proyecto siga corriendo en local sin necesidad de cambiar nada en tu computadora.

---

## 1. ¿Qué se cambió en el código?

1. **Frontend ([apiClient.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-app/src/services/apiClient.js))**:
   - Se reemplazó `"http://localhost:4000/api"` (tanto en la configuración base de Axios como en la petición de refresco `/auth/refresh`) por:
     ```js
     const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
     ```
   - Si no defines `REACT_APP_API_URL` en tu computadora, sigue usando `http://localhost:4000/api` automáticamente.
   - Se dejó listo el archivo de referencia [ecommerce-app/.env.example](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-app/.env.example).

2. **Backend ([server.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/server.js) y [swagger.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/src/config/swagger.js))**:
   - En `server.js`, la configuración de CORS lee `process.env.CORS_ORIGIN` (o `process.env.FRONTEND_URL`) con `"http://localhost:3000"` como valor por defecto para local, limpia barras finales (`/`) para evitar bloqueos de CORS y permite pasar varios dominios separados por coma si tienes más de una URL.
   - En `swagger.js`, la URL del servidor usa `process.env.API_URL` con fallback a `http://localhost:4000/api`.
   - Se actualizó [ecommerce-api/.env.example](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/.env.example) con todas las variables documentadas.

---

## 2. Variables que debes configurar en Producción

Como vas a desplegar el **backend** y el **frontend** en servicios separados y la base de datos en **MongoDB Atlas**, estas son las variables que debes dar de alta en el panel de cada servicio:

### A) En el servicio del Frontend (`ecommerce-app`)

*(Nota: En Create React App todas las variables deben empezar con `REACT_APP_` para que el navegador pueda leerlas al compilar).*

| Nombre de la variable | ¿Para qué sirve? (en palabras simples) | Valor por defecto en local | Ejemplo en Producción |
| :--- | :--- | :--- | :--- |
| **`REACT_APP_API_URL`** | Le dice al frontend en qué dirección de internet vive tu backend para pedirle productos, iniciar sesión y crear órdenes (debe terminar en `/api`). | `http://localhost:4000/api` | `https://mi-eshop-api.onrender.com/api` |

---

### B) En el servicio del Backend (`ecommerce-api`)

| Nombre de la variable | ¿Para qué sirve? (en palabras simples) | Valor por defecto en local | Ejemplo en Producción |
| :--- | :--- | :--- | :--- |
| **`NODE_ENV`** | Le avisa al servidor que está en modo producción (esto apaga automáticamente la página pública de `/api-docs` de Swagger por seguridad). | *(desarrollo)* | `production` |
| **`PORT`** | El puerto donde escucha el servidor. *(Muchos servicios como Render o Railway lo inyectan solos, pero conviene saberlo).* | `4000` | `4000` *(o el que asigne tu hosting)* |
| **`CORS_ORIGIN`** | Es la lista de invitados del backend: indica la URL exacta de tu **frontend en producción** para darle permiso de conectarse a la API y bloquear sitios extraños. | `http://localhost:3000` | `https://mi-eshop.vercel.app` |
| **`MONGODB_URI`** | El link de conexión a tu base de datos en **MongoDB Atlas** (incluye usuario, contraseña y nombre de la base de datos en la nube). | `mongodb://localhost:27017/ecommerce-db-test` | `mongodb+srv://usuario:password@cluster0.xyz.mongodb.net/eshop?retryWrites=true&w=majority` |
| **`JWT_SECRET`** | La llave secreta con la que el backend firma los tokens de sesión (`authToken`). Debe ser una cadena larga y aleatoria que nadie adivine. | *(definido en `.env`)* | Cadena aleatoria de 64 caracteres |
| **`JWT_REFRESH_TOKEN`** | La segunda llave secreta, usada exclusivamente para firmar los tokens de renovación de sesión (`refreshToken`). Debe ser distinta de `JWT_SECRET`. | *(definido en `.env`)* | Otra cadena aleatoria de 64 caracteres |
| **`JWT_EXPIRES_IN`** | Cuánto tiempo dura activo el token de acceso antes de pedir renovación automática. | `1h` | `1h` |
| **`JWT_REFRESH_EXPIRES_IN`** | Cuánto tiempo dura la sesión guardada del usuario antes de pedirle que vuelva a escribir su contraseña. | `7d` | `7d` |
| **`CLOUDINARY_CLOUD_NAME`** | El nombre de tu cuenta de Cloudinary para poder subir fotos de productos desde el panel de administrador. | *(vacío)* | `mi-nube-eshop` |
| **`CLOUDINARY_API_KEY`** | Tu llave pública de Cloudinary para identificar tu cuenta al subir imágenes. | *(vacío)* | `123456789012345` |
| **`CLOUDINARY_API_SECRET`** | Tu llave privada de Cloudinary que autoriza la subida de imágenes. | *(vacío)* | `abcDEF123_secreto_cloudinary` |

---

## 3. Consejo rápido antes de desplegar

1. **En MongoDB Atlas**: dentro de la sección **Network Access**, asegúrate de permitir la IP de tu servidor de backend (o `0.0.0.0/0` si tu proveedor de hosting usa IPs dinámicas como Render/Vercel) para que el backend pueda conectarse.
2. **En `CORS_ORIGIN`**: escribe el dominio de tu frontend **sin la diagonal `/` al final** (aunque el código ya la limpia automáticamente por si se te va una `/` de más).
