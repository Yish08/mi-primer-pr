# Informe de Auditoría de Seguridad — OWASP Top 10:2026 (`ecommerce-api`)

> **Alcance y Metodología**: Evaluación estática de **solo lectura** sobre el código fuente de `ecommerce-api/` (`server.js`, `package.json`, `package-lock.json`, `src/routes/`, `src/controllers/`, `src/middlewares/`, `src/models/`, `src/config/`) y `.github/workflows/frontend-ci.yml`. No se modificó ningún archivo de código ni se crearon ramas.

---

## 1. Tabla Resumen — OWASP Top 10:2026

| Categoría OWASP 2026 | Estado | Severidad | Evidencia Principal (`archivo:línea`) |
|---|---|---|---|
| **A01:2026 — Broken Access Control** | **PARCIAL** | **Media** | `src/controllers/orderController.js:104-131` (`POST /api/orders` no valida que `address` y `paymentMethod` pertenezcan a `req.user.userId`); `src/middlewares/isAdminMiddleware.js:1-11` y `isSelfOrAdminMiddleware.js:1-13` protegen bien el resto de rutas. |
| **A02:2026 — Security Misconfiguration** | **PARCIAL** | **Media** | `ecommerce-api/package.json:16-28` y `server.js:15-52` (falta `helmet` y límite en `express.json()`); bien configurados: CORS (`server.js:18-23`), Swagger apagado en prod (`server.js:38-40`), stack trace oculto al cliente (`src/middlewares/errorHandler.js:24-29`) y `.env` en `.gitignore:3`. |
| **A03:2026 — Software Supply Chain Failures** | **EXPUESTO** | **Alta** | `ecommerce-api/package.json:24` y `npm audit`: **9 vulnerabilidades** (2 críticas en `mongoose` y `proxy-addr`, 2 altas en `body-parser` y `brace-expansion`, 5 moderadas en `qs`, `glob`, `minimatch`). |
| **A04:2026 — Cryptographic Failures** | **EXPUESTO** | **Alta** | `src/models/PaymentMethod.js:26,40` y `src/controllers/paymentMethodController.js:56-68` guardan y exponen `cardNumber` y `accountNumber` en texto plano; contraseñas sí usan `bcrypt` con 10 rondas (`src/controllers/authController.js:17-20`). |
| **A05:2026 — Injection** | **EXPUESTO** | **Alta** | `src/controllers/productController.js:20-24` inyecta `req.query.q` directo en `$regex` sin escapar; `src/routes/authRoutes.js:6-9` y `src/controllers/authController.js:23,58` pasan `req.body.email` sin validar tipo string a `User.findOne({ email })`. |
| **A06:2026 — Insecure Design** | **EXPUESTO** | **Alta** | `src/controllers/orderController.js:104-121` confía en `price`, `totalPrice` y `shippingCost` enviados desde el cliente en `req.body`; `src/controllers/cartController.js:157-185` (`POST /api/cart/add`) no valida stock ni cantidades negativas. |
| **A07:2026 — Authentication Failures** | **EXPUESTO** | **Alta** | `src/routes/authRoutes.js:6-9` sin *rate limiting* ni política de contraseñas en `/register`; `src/controllers/authController.js:60-70` permite enumeración de usuarios; `src/controllers/authController.js:82-102` usa `refreshToken` sin revocación. |
| **A08:2026 — Software or Data Integrity Failures** | **PARCIAL** | **Baja** | `.github/workflows/frontend-ci.yml:22,25,46,49` usa tags mutables (`@v4`) y sin bloque `permissions:` explícito; `npm ci` sí valida integridad del lockfile y no existe deserialización insegura en el código. |
| **A09:2026 — Security Logging & Alerting Failures** | **EXPUESTO** | **Media** | `src/middlewares/logger.js:1-6` solo imprime `fecha | método | url` en consola; no se registran logins fallidos (`authController.js:60-70`), tokens inválidos (`authMiddleware.js:6-13`) ni rechazos `403` (`isAdminMiddleware.js:6-8`). |
| **A10:2026 — Mishandling of Exceptional Conditions** | **PARCIAL** | **Media** | `src/controllers/authController.js:47-48` crea el `Cart` antes de `newUser.save()` dejando documentos huérfanos si falla el guardado; `src/controllers/userController.js:31-47` delega duplicados `E11000` a `errorHandler.js:25` respondiendo `500` en vez de `400/409`. |

---

## 2. Detalle de Hallazgos por Categoría (`EXPUESTO` / `PARCIAL`)

### A01:2026 — Broken Access Control (**PARCIAL** | Severidad: **Media**)

- **Qué está protegido**:
  - Control de rol administrativo con `isAdmin` en `src/middlewares/isAdminMiddleware.js:1-11`.
  - Validación de propiedad del recurso (`isSelfOrAdmin` o `isOwnerOrAdmin`) en usuarios (`src/middlewares/isSelfOrAdminMiddleware.js:2-13`), órdenes (`src/controllers/orderController.js:91-94`), carrito (`src/controllers/cartController.js:6-7, 60-62, 119-121, 146-148`), métodos de pago (`src/controllers/paymentMethodController.js:93-95, 123-125`), wishlist (`src/controllers/wishlistController.js:107-109`) y direcciones (`src/controllers/addressController.js:23, 90, 126`).
  - No existe vulnerabilidad SSRF: el backend no realiza peticiones HTTP hacia URLs suministradas por el usuario (la subida de imágenes usa un buffer en memoria hacia Cloudinary en `src/controllers/uploadController.js:10-18`).
- **Hallazgo A01-1 (IDOR en referencias de `POST /api/orders`)**:
  - **Evidencia**: En [orderController.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/src/controllers/orderController.js#L101-L133), `createOrder` recibe `address` y `paymentMethod` desde `req.body`, crea la orden y ejecuta `await newOrder.populate("address")` y `await newOrder.populate("paymentMethod")` sin comprobar que ambos documentos pertenezcan a `req.user.userId`.
  - **Por qué es un riesgo**: Un usuario autenticado que conozca el `ObjectId` de la dirección o tarjeta de otro cliente puede referenciarlos al crear una orden y recibir en la respuesta JSON del `201` los datos privados poblados de ese otro usuario.
  - **Mitigación recomendada**: Antes de crear la orden en `createOrder`, verificar con `Address.findOne({ _id: address, user: userId })` y `PaymentMethod.findOne({ _id: paymentMethod, user: userId })` que ambos recursos existan y pertenezcan al usuario autenticado (respondiendo `403` o `404` en caso contrario).

---

### A02:2026 — Security Misconfiguration (**PARCIAL** | Severidad: **Media**)

- **Qué está protegido**:
  - CORS restringido a `process.env.CORS_ORIGIN || "http://localhost:3000"` ([server.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/server.js#L18-L23)).
  - Swagger UI (`/api-docs`) bloqueado cuando `process.env.NODE_ENV === "production"` ([server.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/server.js#L38-L40)).
  - `errorHandler` oculta el stack trace al cliente respondiendo únicamente `{"status": "error", "message": "Internal Server Error"}` ([errorHandler.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/src/middlewares/errorHandler.js#L24-L29)).
  - Archivos `.env` excluidos en [.gitignore](file:///Users/yishelldiaz/FS2026-01-Integracion/.gitignore#L3-L5) y fuera del historial de archivos rastreados por Git.
- **Hallazgo A02-1 (Falta de `helmet` y de límite de tamaño en `express.json()`)**:
  - **Evidencia**: En [server.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/server.js#L15-L26) y [package.json](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/package.json#L16-L26) no se utiliza `helmet` y `app.use(express.json())` se registra sin opción `limit`.
  - **Por qué es un riesgo**: La API expone la cabecera `X-Powered-By: Express`, carece de cabeceras defensivas (`X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Frame-Options`) y acepta payloads JSON de hasta 100 KB por defecto sin control explícito por ruta.
  - **Mitigación recomendada**: Instalar y registrar `helmet()` al inicio del pipeline de middlewares en `server.js` y configurar un límite explícito en `express.json({ limit: "50kb" })`.

---

### A03:2026 — Software Supply Chain Failures (**EXPUESTO** | Severidad: **Alta**)

- **Hallazgo A03-1 (Dependencias con CVEs críticos y altos en `npm audit`)**:
  - **Evidencia**: Al ejecutar `npm audit` sobre [package-lock.json](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/package-lock.json) y [package.json](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/package.json#L16-L28), se detectan **9 vulnerabilidades (2 críticas, 2 altas, 5 moderadas)**:
    - **Críticas**: `mongoose` (`9.0.0 - 9.11.3`: *Prototype Pollution* y falta de aplicación de `sanitizeFilter` — `GHSA-664h-wqgq-64gw`, `GHSA-gg4r-jv3p-qx3c`, `GHSA-wr5m-5jph-8m96`) y `proxy-addr` (`1.1.0 - 2.0.7`: *IP spoofing via IPv4-mapped IPv6* — `GHSA-jqcg-44mw-7w3h`).
    - **Altas**: `body-parser` (`2.0.0 - 2.3.0`: DoS — `GHSA-v422-hmwv-36x6`, `GHSA-27r3-jxmh-p828`) y `brace-expansion` (`3.0.0 - 5.0.11`: DoS).
    - **Moderadas**: `qs`, `glob` y `minimatch`.
  - **Por qué es un riesgo**: Las vulnerabilidades en `mongoose` y `body-parser` afectan directamente el procesamiento de peticiones HTTP y consultas a base de datos en tiempo de ejecución, exponiendo el servidor a contaminación de prototipos y denegación de servicio (DoS).
  - **Mitigación recomendada**: Ejecutar `npm audit fix` en `ecommerce-api/` para actualizar `mongoose`, `body-parser`, `proxy-addr` y `qs` a versiones parchadas, e integrar `npm audit --audit-level=high` en el workflow de GitHub Actions.

---

### A04:2026 — Cryptographic Failures (**EXPUESTO** | Severidad: **Alta**)

- **Qué está protegido**:
  - Las contraseñas se almacenan con `bcrypt.hash(password, 10)` ([authController.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/src/controllers/authController.js#L17-L20) y [userController.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/src/controllers/userController.js#L4-L7)) y se excluyen en consultas con `.select("-password")`.
- **Hallazgo A04-1 (Números de tarjeta `cardNumber` y cuentas bancarias `accountNumber` en texto plano)**:
  - **Evidencia**: En [PaymentMethod.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/src/models/PaymentMethod.js#L26-L42) y [paymentMethodController.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/src/controllers/paymentMethodController.js#L56-L68), `cardNumber` (hasta 19 caracteres) y `accountNumber` se guardan tal cual en MongoDB y se devuelven completos en `GET /api/payment-methods` (`línea 12-15`) y en `GET /api/orders/my-orders` ([orderController.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/src/controllers/orderController.js#L71)).
  - **Por qué es un riesgo**: Almacenar y retornar el PAN completo de tarjetas de crédito/débito o cuentas bancarias en texto plano incumple PCI-DSS y expone los medios de pago de todos los clientes ante cualquier filtración de base de datos o robo de token JWT.
  - **Mitigación recomendada**: Nunca almacenar el número completo de tarjeta; guardar únicamente los últimos 4 dígitos (`last4`) junto con un token de pasarela de pagos, o cifrar el campo con AES-256-GCM antes de persistirlo y enmascararlo en todas las respuestas de la API.

---

### A05:2026 — Injection (**EXPUESTO** | Severidad: **Alta**)

- **Hallazgo A05-1 (Inyección NoSQL en `/api/auth/login` y `/api/auth/register` por falta de validación de tipos)**:
  - **Evidencia**: En [authRoutes.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/src/routes/authRoutes.js#L6-L9) no se aplica `express-validator`. En [authController.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/src/controllers/authController.js#L22-L25) (`checkUserExist`), `req.body.email` se pasa directamente a `User.findOne({ email })`.
  - **Por qué es un riesgo**: Si un cliente envía un objeto JSON como `{"email": {"$ne": null}, "password": "..."}`, Mongoose/MongoDB puede interpretar operadores de consulta o provocar errores no controlados al no garantizar que `email` y `password` sean estrictamente `String`.
  - **Mitigación recomendada**: Agregar validaciones `body("email").isString().isEmail()` y `body("password").isString().notEmpty()` con `express-validator` en `authRoutes.js`, y activar `mongoose.set("sanitizeFilter", true)` en `db.conf.js`.
- **Hallazgo A05-2 (Inyección de Expresiones Regulares / ReDoS en `GET /api/products/search`)**:
  - **Evidencia**: En [productController.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/src/controllers/productController.js#L20-L24), el parámetro `req.query.q` se inyecta sin escapar dentro de `{ $regex: q, $options: "i" }`.
  - **Por qué es un riesgo**: Un usuario puede enviar una expresión regular con cuantificadores anidados maliciosos (*Catastrophic Backtracking* / ReDoS) que bloquee el hilo de ejecución de MongoDB/Node.js.
  - **Mitigación recomendada**: Escapar los caracteres especiales de RegExp en `q` (`q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")`) y limitar su longitud máxima (ej. 100 caracteres) antes de construir el filtro `$regex`.

---

### A06:2026 — Insecure Design (**EXPUESTO** | Severidad: **Alta**)

- **Hallazgo A06-1 (Manipulación de precios y totales desde el cliente en `POST /api/orders`)**:
  - **Evidencia**: En [orderController.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/src/controllers/orderController.js#L104-L121) y [orderRoutes.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/src/routes/orderRoutes.js#L38-L61), el servidor acepta `products.*.price`, `totalPrice` y `shippingCost` directamente del `req.body` (solo validando que sean `>= 0`).
  - **Por qué es un riesgo**: Un comprador puede interceptar la petición `POST /api/orders` y enviar `price: 0`, `shippingCost: 0` y `totalPrice: 0`, generando una orden válida gratis y descontando el inventario real del producto.
  - **Mitigación recomendada**: Ignorar los precios enviados por el cliente y calcular en el servidor el `price` unitario, `shippingCost`, impuestos y `totalPrice` leyendo siempre el `price` vigente desde `Product.findById(productId)` en MongoDB.
- **Hallazgo A06-2 (`POST /api/cart/add` sin validación de esquema ni tope de stock)**:
  - **Evidencia**: En [cartRoutes.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/src/routes/cartRoutes.js#L119) y [cartController.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/src/controllers/cartController.js#L157-L185), `addProductToCart` no valida que `productId` sea un ObjectId existente ni que `quantity` sea un entero positivo dentro del `stock` disponible.
  - **Por qué es un riesgo**: Permite inyectar cantidades negativas o superiores al stock real directamente en el carrito del servidor.
  - **Mitigación recomendada**: Agregar `express-validator` en `POST /api/cart/add` (`productId` MongoId, `quantity` entero `>= 1`) y verificar en el controlador que el producto exista y tenga stock suficiente.

---

### A07:2026 — Authentication Failures (**EXPUESTO** | Severidad: **Alta**)

- **Hallazgo A07-1 (Falta de Rate Limiting en endpoints de autenticación)**:
  - **Evidencia**: En [authRoutes.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/src/routes/authRoutes.js#L6-L9) y [server.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/server.js#L15-L52) no existe limitador de peticiones por IP/cuenta.
  - **Por qué es un riesgo**: Permite ataques automatizados de fuerza bruta y *credential stuffing* contra `POST /api/auth/login` a miles de intentos por minuto.
  - **Mitigación recomendada**: Incorporar `express-rate-limit` en `/api/auth/login` y `/api/auth/register` (por ejemplo, máximo 10 intentos cada 15 minutos por IP).
- **Hallazgo A07-2 (Registro público sin política de contraseñas y enumeración de usuarios en Login)**:
  - **Evidencia**: En [authController.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/src/controllers/authController.js#L27-L70), `/api/auth/register` no exige longitud ni complejidad mínima de contraseña (a diferencia de `userRoutes.js:26-28`), y `/api/auth/login` responde mensajes distintos cuando el correo no existe (`"User does not exist. You must sign in."`, línea 63) vs cuando la contraseña falla (`"Invalid Credentials"`, línea 69).
  - **Por qué es un riesgo**: Facilita cuentas con contraseñas débiles y permite a un atacante descubrir qué correos electrónicos están registrados en la tienda.
  - **Mitigación recomendada**: Unificar el mensaje de error de login a `"Invalid credentials"` (código `401`) en ambos casos y aplicar en `/api/auth/register` validación de longitud mínima (`>= 8` caracteres) y complejidad.

---

### A08:2026 — Software or Data Integrity Failures (**PARCIAL** | Severidad: **Baja**)

- **Hallazgo A08-1 (Acciones de CI/CD sin fijar por SHA y sin permisos mínimos declarados)**:
  - **Evidencia**: En [frontend-ci.yml](file:///Users/yishelldiaz/FS2026-01-Integracion/.github/workflows/frontend-ci.yml#L1-L50), los pasos usan `actions/checkout@v4` y `actions/setup-node@v4` por etiqueta mutable y el archivo no define `permissions: contents: read`.
  - **Por qué es un riesgo**: Si un tag de una acción de terceros fuera comprometido o si un paso del workflow tuviera vulnerabilidades, el `GITHUB_TOKEN` tendría permisos por defecto más amplios de los necesarios.
  - **Mitigación recomendada**: Declarar `permissions: contents: read` a nivel de workflow en `.github/workflows/frontend-ci.yml` y fijar las acciones a sus commit SHAs completos.

---

### A09:2026 — Security Logging & Alerting Failures (**EXPUESTO** | Severidad: **Media**)

- **Hallazgo A09-1 (Ausencia de registro de eventos de seguridad: logins fallidos y accesos denegados `401`/`403`)**:
  - **Evidencia**: [logger.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/src/middlewares/logger.js#L1-L6) solo ejecuta `console.log` con `fecha | método | url` al entrar la petición (sin `statusCode`, IP ni `userId`), y está desactivado en `test`. Los fallos en [authMiddleware.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/src/middlewares/authMiddleware.js#L6-L13), [isAdminMiddleware.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/src/middlewares/isAdminMiddleware.js#L6-L8) y [authController.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/src/controllers/authController.js#L60-L70) no se persisten en `logs/`.
  - **Por qué es un riesgo**: Ante un ataque de fuerza bruta, uso de tokens manipulados o intentos de escalada de privilegios a rutas admin, no queda ningún registro de auditoría para detectar o investigar el incidente.
  - **Mitigación recomendada**: Registrar en un log estructurado (`logs/security.log`) cada evento `401`/`403`, login fallido y acción administrativa incluyendo timestamp, IP (`req.ip`), ruta, `userId` (si existe) y `res.statusCode`.

---

### A10:2026 — Mishandling of Exceptional Conditions (**PARCIAL** | Severidad: **Media**)

- **Hallazgo A10-1 (Creación de carrito antes de persistir el usuario en `POST /api/auth/register`)**:
  - **Evidencia**: En [authController.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/src/controllers/authController.js#L47-L48), se ejecuta `await Cart.create({ user: newUser._id, products: [] })` antes de `await newUser.save()`.
  - **Por qué es un riesgo**: Si `newUser.save()` lanza una excepción (por ejemplo, violación de índice único o validación de esquema), el documento `Cart` ya creado queda huérfano en la base de datos.
  - **Mitigación recomendada**: Ejecutar primero `await newUser.save()` y solo después crear el carrito asociado (o envolver ambos en una sesión/transacción o borrar el carrito en el bloque `catch`).
- **Hallazgo A10-2 (Errores de validación/duplicados de Mongoose devueltos como `500 Internal Server Error`)**:
  - **Evidencia**: En [errorHandler.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/src/middlewares/errorHandler.js#L24-L29), cualquier error pasado a `next(error)` (como un email duplicado `code === 11000` en `POST /api/users` dentro de [userController.js](file:///Users/yishelldiaz/FS2026-01-Integracion/ecommerce-api/src/controllers/userController.js#L35-L46)) responde siempre HTTP `500`.
  - **Por qué es un riesgo**: Oculta errores de cliente (`400`/`409`) detrás de falsos errores `500`, ensuciando `logs/error.log` y degradando el manejo de excepciones.
  - **Mitigación recomendada**: Distinguir en `errorHandler.js` los errores `err.name === "ValidationError"` (`400`) y `err.code === 11000` (`409 Conflict`) antes de caer en el `500` genérico.

---

## 3. Backlog Priorizado de Remediación (1 ítem = 1 Rama / PR)

### Prioridad Alta (Críticos / Explotables)
1. **[PR-01 | A06] Calcular precios y totales en el servidor al crear órdenes (`fix/order-server-side-pricing`)**
   - En `src/controllers/orderController.js`, obtener el precio real desde `Product` en base de datos e ignorar `price`, `shippingCost` y `totalPrice` enviados por el cliente.
2. **[PR-02 | A04] Eliminar almacenamiento y exposición en texto plano de tarjetas y cuentas (`fix/payment-data-masking`)**
   - En `src/models/PaymentMethod.js` y `src/controllers/paymentMethodController.js`, almacenar únicamente los últimos 4 dígitos (o cifrar en reposo) y nunca devolver el PAN completo en respuestas JSON.
3. **[PR-03 | A05] Validar tipos en Auth y escapar `$regex` en búsqueda de productos (`fix/nosql-and-regex-injection`)**
   - Agregar `express-validator` en `src/routes/authRoutes.js` y `POST /api/cart/add`, activar `sanitizeFilter` en Mongoose y escapar metacaracteres regex en `src/controllers/productController.js:20-24`.
4. **[PR-04 | A07] Añadir Rate Limiting, política de contraseñas y mensajes uniformes en Auth (`fix/auth-hardening`)**
   - Configurar `express-rate-limit` en `/api/auth/*`, exigir contraseña fuerte en `/api/auth/register` y unificar el mensaje de error de `/api/auth/login`.
5. **[PR-05 | A03] Actualizar dependencias vulnerables de `ecommerce-api` (`chore/npm-audit-fix`)**
   - Ejecutar `npm audit fix` para actualizar `mongoose`, `body-parser`, `proxy-addr`, `qs` y `brace-expansion` a versiones sin CVEs.

### Prioridad Media (Defensa en Profundidad y Control de Acceso)
6. **[PR-06 | A01] Validar propiedad de `address` y `paymentMethod` en `POST /api/orders` (`fix/order-idor-check`)**
   - Verificar en `src/controllers/orderController.js` que la dirección y el método de pago pertenezcan a `req.user.userId` antes de crear la orden.
7. **[PR-07 | A02] Incorporar `helmet` y límite de tamaño en `express.json()` (`feat/security-headers-and-limits`)**
   - Configurar `helmet()` y `express.json({ limit: "50kb" })` en `ecommerce-api/server.js`.
8. **[PR-08 | A09] Implementar bitácora de eventos de seguridad (`feat/security-audit-logger`)**
   - Registrar en `logs/security.log` los intentos de login fallidos, rechazos `401`/`403` y acciones administrativas con IP, usuario y código HTTP.
9. **[PR-09 | A10] Corregir orden de guardado en `/auth/register` y mapeo de errores en `errorHandler` (`fix/register-atomicity-and-error-codes`)**
   - Guardar `newUser.save()` antes de `Cart.create()` en `authController.js` y mapear errores `11000` / `ValidationError` en `errorHandler.js`.

### Prioridad Baja (Endurecimiento de CI/CD)
10. **[PR-10 | A08] Declarar permisos mínimos y fijar SHAs en GitHub Actions (`ci/harden-github-workflow`)**
    - Añadir `permissions: contents: read` y fijar versiones inmutables de las acciones en `.github/workflows/frontend-ci.yml`.
