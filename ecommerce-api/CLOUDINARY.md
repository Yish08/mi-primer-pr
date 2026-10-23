# Subida de imágenes con Cloudinary

**Endpoint:** `POST /api/upload` · **Solo admin** · La imagen va en el campo `image` de un `form-data` · Responde con la URL que genera Cloudinary.

Todo lo que se describe aquí ya está implementado y probado (ver la [sección 7](#7-cómo-lo-verifiqué)).

---

## 0. La idea en un minuto

Los productos necesitan fotos. Guardar los archivos en nuestro propio servidor trae problemas: ocupa disco, se pierden si el servidor se reinicia en la nube y se sirven lentos. **Cloudinary** guarda la imagen y la entrega desde su CDN (servidores repartidos por el mundo). En nuestra base de datos solo guardamos **la URL** (en `imagesUrl` del producto).

El recorrido de una imagen:

```
Navegador / Postman
  │  POST /api/upload   (form-data con el campo "image")
  │  Authorization: Bearer <token de admin>
  ▼
authMiddleware ──► isAdmin ──► receiveImage (multer) ──► uploadImage (controller)
 ¿hay token?     ¿es admin?    lee el archivo y lo deja    lo manda a Cloudinary
                               en req.file.buffer (RAM)    con upload_stream
                                                                  │
  ◄────────────── 201 { url, publicId, width, height, ... } ◄─────┘
```

Archivos que intervienen:

| Archivo | Qué hace |
|---|---|
| `src/config/cloudinary.conf.js` | Configura el SDK con las credenciales del `.env` |
| `src/middlewares/uploadMiddleware.js` | **multer**: recibe el archivo y valida tipo y peso |
| `src/controllers/uploadController.js` | Sube el archivo a Cloudinary y responde la URL |
| `src/routes/uploadRoutes.js` | Define `POST /upload` con sus middlewares |
| `src/routes/index.js` | Registra las rutas de upload |
| `server.js` | Llama a `connectCloudinary()` al arrancar |

---

## 1. Los paquetes: qué hace cada uno

### multer: recibir archivos en Express

Express, por sí solo, entiende cuerpos en JSON (`express.json()`). Pero un archivo **no viaja como JSON**: viaja como `multipart/form-data`, un formato que parte el cuerpo de la petición en "piezas", unas con texto y otras con los bytes de los archivos.

**multer** es un middleware que lee ese formato y deja:

- el archivo en **`req.file`**
- los campos de texto (si los hay) en **`req.body`**

> Multer solo procesa peticiones `multipart/form-data`. Si mandas JSON, simplemente no hace nada y `req.file` queda `undefined`.

Multer puede guardar el archivo de dos formas (se llaman *storage engines*):

| Storage | Dónde queda el archivo | Cuándo conviene |
|---|---|---|
| `diskStorage` | En una carpeta del servidor (`req.file.path`) | Cuando el archivo se queda en tu servidor |
| `memoryStorage` | En la RAM, como `Buffer` (`req.file.buffer`) | Cuando lo vas a reenviar a otro servicio |

Usamos **`memoryStorage`**: el archivo va directo a Cloudinary, así que no tiene sentido escribirlo en disco y luego borrarlo. La documentación de multer advierte que con memoria hay que **limitar el peso**, porque archivos grandes (o muchos a la vez) pueden acabarse la RAM del servidor. Por eso ponemos un límite de 5 MB.

### cloudinary: el SDK oficial

**Cloudinary** es un servicio que guarda imágenes y videos, los sirve por CDN y puede transformarlos al vuelo (cambiar tamaño, formato, calidad) solo cambiando la URL.

El paquete **`cloudinary`** es su SDK oficial para Node. Se encarga de:

- firmar cada petición con tu `api_key` y `api_secret` (por eso el secreto **nunca** va en el frontend)
- subir archivos (`uploader.upload`, `uploader.upload_stream`)
- borrarlos (`uploader.destroy`)
- consultar tu cuenta (`api.resource`, `api.config`)

### Instalación

```bash
cd ecommerce-api
npm install multer@2.5.0
npm install cloudinary        # ya estaba instalado: 2.11.0, la versión más reciente
```

En `package.json` quedan:

```json
"cloudinary": "^2.11.0",
"multer": "^2.5.0"
```

**¿Por qué multer 2.5.0 y no "la que sea"?**

- La versión 1.x tiene vulnerabilidades conocidas y ya no se debe usar.
- Casi todas las versiones 2.x corrigen alguna vulnerabilidad. La **2.5.0 salió el 22 de octubre de 2026** y corrige una de severidad **alta** ([GHSA-q7qp-rjg7-q26m](https://github.com/expressjs/multer/security/advisories/GHSA-q7qp-rjg7-q26m)): un `fileFilter` **asíncrono** podía tumbar el servidor con una sola petición.
- Como era una versión del mismo día, antes de instalarla se verificó que fuera legítima. Se publicó desde el repositorio oficial con GitHub Actions y trae atestación de procedencia (*provenance*). Después de instalar, `npm audit signatures` confirmó las firmas de los 139 paquetes.
- Además, nuestro `fileFilter` es **síncrono**, así que ni siquiera usa la parte afectada.

---

## 2. Credenciales y configuración

### Las variables del `.env`

```env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

Se obtienen en la consola de Cloudinary, en **Dashboard** o en **Settings → API Keys**.

Reglas de seguridad:

- **El `api_secret` solo vive en el backend.** Todo lo que pongas en React termina en el navegador del usuario y cualquiera puede leerlo.
- **El `.env` no se sube a git.** En este repo ya está en el `.gitignore` de la raíz, y se revisó que nunca se haya subido al historial.
- Si cambias algo del `.env`, **reinicia el servidor**: nodemon no vigila ese archivo.

### `src/config/cloudinary.conf.js`

```js
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
```

Esta es la forma de importar y configurar el SDK que indica la documentación oficial para ES modules (`import { v2 as cloudinary } from "cloudinary"` + `cloudinary.config({...})`).

### La trampa de ES modules + dotenv (importante)

Muchos tutoriales hacen esto:

```js
// ❌ En este proyecto NO funciona
import { v2 as cloudinary } from "cloudinary";
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, ... });
```

En este proyecto daría `undefined`. Pasa por el orden en que Node ejecuta `server.js`:

1. **Primero ejecuta todos los `import`.** Eso incluye `cloudinary.conf.js`, las rutas y los controllers.
2. **Después** ejecuta `dotenv.config()`, que es cuando se cargan las variables del `.env`.
3. Al final corre el resto: `connectDB()`, `connectCloudinary()`, `app.listen()`...

Si la configuración se leyera en el paso 1, `process.env` todavía estaría vacío. Por eso `connectCloudinary` es una **función** que se llama en el paso 3, igual que tu `connectDB`.

### Cambios en `server.js`

```js
import connectCloudinary from "./src/config/cloudinary.conf.js";
import connectDB from "./src/config/db.conf.js";
// ...
dotenv.config();
// ...
connectDB();
connectCloudinary();
```

Al arrancar, la consola muestra:

```
Cloudinary configured <tu_cloud_name>
```

---

## 3. El middleware: recibir el archivo con multer

### `src/middlewares/uploadMiddleware.js`

```js
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
```

### Pieza por pieza

- **`multer({ ... })`** crea el "lector" de archivos con sus reglas.
- **`storage: multer.memoryStorage()`** deja el archivo en RAM, en `req.file.buffer`.
- **`limits.fileSize`**: peso máximo en bytes (5 MB). Por defecto multer no tiene límite.
- **`limits.files: 1`**: solo un archivo por petición.
- **`fileFilter`** decide si acepta el archivo. Su contrato, según la documentación:
  - `cb(null, true)` lo acepta
  - `cb(null, false)` lo ignora en silencio
  - `cb(new Error(...))` lo rechaza con error. Aquí usamos esta opción, para poder avisarle al usuario.
- **`upload.single("image")`** lee **un** archivo del campo llamado `image`. Ese nombre es el que debe usar el frontend o Postman.

Lo que queda en `req.file` con `memoryStorage`:

| Campo | Ejemplo |
|---|---|
| `fieldname` | `"image"` |
| `originalname` | `"iphone.png"` (lo manda el cliente, no es confiable) |
| `mimetype` | `"image/png"` (también lo manda el cliente) |
| `size` | `3376` (bytes) |
| `buffer` | Los bytes del archivo |

### ¿Por qué envolver `upload.single()`?

Tu `errorHandler` responde **500** a cualquier error. Pero "la imagen pesa mucho" o "el formato no se permite" son errores **del cliente** (400): el usuario puede corregirlos. El wrapper `receiveImage` atrapa esos errores y responde 400 con un mensaje en español:

| Situación | Código de multer | Respuesta |
|---|---|---|
| Pesa más de 5 MB | `LIMIT_FILE_SIZE` | 400 `La imagen no debe pesar más de 5 MB` |
| Más de un archivo | `LIMIT_FILE_COUNT` | 400 `Solo se puede subir una imagen a la vez` |
| Campo distinto de `image` | `LIMIT_UNEXPECTED_FILE` | 400 `La imagen debe enviarse en el campo "image"` |
| No es imagen (ej. `.txt`) | Error de `fileFilter` | 400 `Formato no permitido...` |

---

## 4. El controller: subir el archivo a Cloudinary

### `src/controllers/uploadController.js`

```js
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
```

### `upload_stream`: subir desde memoria

El archivo está en un `Buffer` (en RAM), no en una ruta del disco. La documentación de Cloudinary indica `upload_stream` para estos casos:

- `upload_stream(opciones, callback)` **devuelve un stream, no una promesa**. La propia documentación lo envuelve en un `new Promise(...)` para poder usar `await`, que es lo que hace `uploadBuffer`.
- `.end(buffer)` manda los bytes y cierra el stream.
- Cuando Cloudinary termina, llama al callback con `(error, result)`.

> **Alternativa:** `cloudinary.uploader.upload()` sí devuelve promesa, pero necesita una ruta de archivo, una URL o un *data URI* en base64. Con base64 el archivo pesa un 33% más en memoria. Para un buffer, `upload_stream` es lo más directo.

### Las opciones de subida

| Opción | Qué hace |
|---|---|
| `resource_type: "image"` | Indica que es una imagen (también puede ser `video`, `raw` o `auto`). |
| `asset_folder: "ecommerce/products"` | La carpeta donde la verás en la consola de Cloudinary. |
| `allowed_formats` | Cloudinary revisa el **contenido real** del archivo y rechaza otros formatos. Esto atrapa, por ejemplo, un texto renombrado como `.png`. |

**`asset_folder` vs `folder`.** Desde el 4 de junio de 2024 las cuentas nuevas usan **carpetas dinámicas** (*dynamic folders*). Según la documentación, en ese modo el parámetro `folder` **está deprecado** y se usa `asset_folder`. Se consultó tu cuenta con la Admin API (`api.config({ settings: true })`) y respondió `folder_mode: "dynamic"`, así que `asset_folder` es el correcto.

Un detalle útil: `asset_folder` solo organiza la consola. Si después mueves la imagen a otra carpeta, **su URL no cambia** y los productos no se rompen.

### Lo que responde Cloudinary y lo que devolvemos

Cloudinary responde con muchos datos. Devolvemos los útiles:

| Campo nuestro | Viene de | Para qué sirve |
|---|---|---|
| `url` | `secure_url` | La URL **https** de la imagen. **Esta es la que se guarda en `imagesUrl`.** |
| `publicId` | `public_id` | El "id" de la imagen en Cloudinary. Sirve para borrarla o reemplazarla después con `cloudinary.uploader.destroy(publicId)`. |
| `width`, `height` | `width`, `height` | Medidas en píxeles. |
| `format` | `format` | `png`, `jpg`, `webp`... |
| `bytes` | `bytes` | Peso final. |

Usamos `secure_url` y no `url` porque `url` es `http://`. Una página `https` que carga imágenes por `http` genera advertencias de contenido mixto.

### Manejo de errores

- **`error.http_code === 400`**: Cloudinary rechazó el archivo, por ejemplo porque no es una imagen válida. Es culpa del archivo, así que respondemos **400** con un mensaje claro.
- **Cualquier otro error**, como credenciales incorrectas (401 de Cloudinary) o falta de red, es problema del servidor. Va a `next(error)`, tu `errorHandler` responde **500** y lo deja escrito en `logs/error.log`.

---

## 5. La ruta

### `src/routes/uploadRoutes.js`

```js
import express from "express";
import { uploadImage } from "../controllers/uploadController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";
import receiveImage from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Solo admin: cada subida ocupa espacio y creditos de la cuenta de Cloudinary.
// Orden: token -> rol admin -> multer recibe el archivo -> se sube a Cloudinary
router.post("/upload", authMiddleware, isAdmin, receiveImage, uploadImage);

export default router;
```

### Registro en `src/routes/index.js`

```js
import uploadRoutes from "./uploadRoutes.js";
// ...
router.use(uploadRoutes);
```

Como todas tus rutas, queda bajo `/api`: **`POST http://localhost:4000/api/upload`**.

### ¿Por qué protegerla con `authMiddleware` + `isAdmin`?

- **Sin protección**, cualquiera podría llenar tu cuenta de Cloudinary con archivos y gastar tus créditos.
- Son las **mismas protecciones** que ya tienen `POST`, `PUT` y `DELETE /products`: solo el admin administra productos.
- **El orden importa.** Primero se revisa el token y el rol, **después** se lee el archivo. Así una petición sin permiso se rechaza antes de cargar 5 MB en memoria.

---

## 6. Cómo probarlo

### Con Postman o Thunder Client

1. **Método:** `POST`. **URL:** `http://localhost:4000/api/upload`
2. **Headers:** `Authorization: Bearer <token de admin>`
   - El token se obtiene al iniciar sesión (`POST /api/auth/login`) con tu usuario admin.
   - También está en el navegador: DevTools → Application → Local Storage → `authToken`.
3. **Body:** elige **form-data**.
   - En **Key** escribe `image` y cambia el tipo de *Text* a **File**.
   - En **Value** selecciona una imagen de tu computadora.
4. **No pongas** el header `Content-Type` a mano. Postman lo arma solo, con el *boundary* que necesita el multipart.

### Con curl

```bash
curl -X POST http://localhost:4000/api/upload \
  -H "Authorization: Bearer TU_TOKEN_DE_ADMIN" \
  -F "image=@C:/ruta/a/tu/foto.jpg"
```

### Respuesta correcta (201)

```json
{
  "url": "https://res.cloudinary.com/<tu_cloud_name>/image/upload/v1792726431/hmfrfxsb43bxqxguro5t.png",
  "publicId": "hmfrfxsb43bxqxguro5t",
  "width": 480,
  "height": 320,
  "format": "png",
  "bytes": 3376
}
```

### Respuestas de error

| Código | Mensaje | Causa |
|---|---|---|
| 401 | `Unauthorized` | No mandaste el token |
| 403 | `Admin access required` | El usuario no es admin |
| 400 | `No se recibió ninguna imagen en el campo "image"` | No hay archivo, o mandaste JSON en vez de form-data |
| 400 | `La imagen debe enviarse en el campo "image"` | La *key* del form-data no se llama `image` |
| 400 | `Formato no permitido...` | El archivo no es JPG, PNG, WEBP o GIF |
| 400 | `La imagen no debe pesar más de 5 MB` | Archivo muy pesado |
| 400 | `Solo se puede subir una imagen a la vez` | Mandaste dos archivos |
| 400 | `El archivo no es una imagen válida...` | Cloudinary revisó el contenido y no es una imagen |
| 500 | `Internal Server Error` | Credenciales de Cloudinary mal escritas o sin red (revisa `logs/error.log`) |

---

## 7. Cómo lo verifiqué

Se levantó una copia del API en el puerto 4100, con tu `.env` y tu cuenta real de Cloudinary, y se corrieron 12 casos. **La imagen de prueba que se subió se borró al final** con `cloudinary.uploader.destroy` (respuesta `ok`).

| # | Caso | Resultado |
|---|---|---|
| 1 | Sin token | ✅ 401 |
| 2 | Token de customer | ✅ 403 |
| 3 | Admin sin archivo | ✅ 400 |
| 4 | Admin mandando JSON en vez de form-data | ✅ 400 |
| 5 | Archivo `.txt` | ✅ 400 (lo frena `fileFilter`) |
| 6 | Campo `file` en vez de `image` | ✅ 400 |
| 7 | Dos imágenes a la vez | ✅ 400 |
| 8 | Imagen de 6 MB | ✅ 400 (límite de 5 MB) |
| 9 | Texto disfrazado de `.png` | ✅ 400 (lo rechaza Cloudinary) |
| 10 | Imagen válida | ✅ 201 con URL `https://res.cloudinary.com/...` |
| 11 | La URL devuelta abre la imagen | ✅ 200 `image/png` |
| 12 | Quedó en la carpeta `ecommerce/products` | ✅ `asset_folder` correcto |

También se confirmó en los logs que la configuración carga en el orden correcto: primero `dotenv` inyecta las variables y luego aparece `Cloudinary configured`.

---

## 8. Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Must supply api_key` o `Must supply cloud_name` | La configuración se leyó antes de `dotenv.config()`, o falta una variable | Revisa que `connectCloudinary()` se llame **después** de `dotenv.config()` y que los nombres del `.env` sean exactos |
| `req.file` es `undefined` | No es `multipart/form-data`, o el campo no se llama `image` | Usa form-data con la key `image` |
| 500 y en `logs/error.log` aparece `Invalid api_key` o `Invalid Signature` | Credenciales mal copiadas | Cópialas de nuevo desde la consola y **reinicia** el servidor |
| Cambié el `.env` y no pasa nada | nodemon no vigila el `.env` | Reinicia el servidor |
| La imagen no aparece en la carpeta esperada | Cuenta en modo de carpetas fijas (*fixed*) | Tu cuenta es *dynamic* (ya verificado). En una cuenta *fixed* se usaría `folder` |

---

## 9. Siguiente paso: el frontend

En el formulario de productos, el campo de texto de la URL se cambiará por un selector de archivo. La idea:

1. `<input type="file" accept="image/*">` para elegir la imagen.
2. Armar un `FormData` con el campo `image` y hacer `POST /upload`.
3. Con la `url` de la respuesta, llenar `imagesUrl` del producto y guardarlo como hoy.

> ⚠️ **Ojo con tu `apiClient`.** Tiene `"Content-Type": "application/json"` por defecto. En tu versión de axios (1.16.0), cuando ese header es JSON, axios **convierte el `FormData` a JSON** y el archivo se pierde. Está en `node_modules/axios/lib/defaults/index.js`. En la llamada de subida hay que indicar el tipo multipart:
>
> ```js
> export async function uploadImage(file) {
>   const formData = new FormData();
>   formData.append("image", file);
>   const response = await apiClient.post("/upload", formData, {
>     headers: { "Content-Type": "multipart/form-data" },
>   });
>   return response.data; // { url, publicId, width, height, format, bytes }
> }
> ```
>
> En el navegador, axios deja que el propio navegador complete el header con el *boundary* correcto.

---

## Fuentes

- Cloudinary: [Node.js SDK (instalación y configuración)](https://cloudinary.com/documentation/node_integration)
- Cloudinary: [Subida de imágenes con Node.js (`upload`, `upload_stream`)](https://cloudinary.com/documentation/node_image_and_video_upload)
- Cloudinary: [Referencia del método upload (`asset_folder`, `allowed_formats`, `folder` deprecado)](https://cloudinary.com/documentation/image_upload_api_reference)
- Cloudinary: [Modos de carpetas (dynamic vs fixed)](https://cloudinary.com/documentation/folder_modes)
- Multer: [README oficial](https://github.com/expressjs/multer)
- Multer: [CHANGELOG](https://github.com/expressjs/multer/blob/main/CHANGELOG.md)
- Multer: [Aviso de seguridad GHSA-q7qp-rjg7-q26m](https://github.com/expressjs/multer/security/advisories/GHSA-q7qp-rjg7-q26m)
