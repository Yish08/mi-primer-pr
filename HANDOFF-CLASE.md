# Handoff — IntegracionFS2026-01

Documento de traspaso para planear la clase del curso **React Full-Stack 2026-2**.
Recoge el estado del monorepo, las correcciones aplicadas el **2026-09-01** y los
puntos que quedaron abiertos a proposito.

---

## 1. Como levantar el proyecto

### Requisitos

- Node.js + npm
- MongoDB corriendo en `localhost:27017`
  (en la maquina del profesor esta como servicio de Windows con arranque automatico,
  no hay que iniciarlo a mano)

### Puertos

| Servicio | Puerto |
|---|---|
| `ecommerce-api` (Express) | **4000** |
| `ecommerce-app` (CRA) | **3000** |

Antes ambos peleaban por el 3000. El backend ahora vive en el 4000, que es justo lo
que ya esperaba `apiClient.js` del frontend, y su CORS permite exactamente
`http://localhost:3000`.

### Pasos — se necesitan 2 terminales

**Terminal 1 — backend**

```powershell
cd ecommerce-api
Copy-Item .env.example .env   # solo la 1ra vez; .env esta en .gitignore
npm install
npm run seedProducts          # solo la 1ra vez, o para resetear la BD
npm run dev                   # nodemon; usa "npm start" para node plano
```

Salida esperada:

```
Server running on http://localhost:4000
MongoDB connected localhost
```

**Terminal 2 — frontend**

```powershell
cd ecommerce-app
npm install
npm start
```

Abrir `http://localhost:3000`.

### Orden importante

Levantar **primero el backend**. El Home consume la API; sin ella muestra
"No se pudieron cargar los productos".

### Verificacion rapida

```powershell
curl http://localhost:4000/api/products
```

Debe devolver los 9 productos del seed, con `imagesUrl` como array:

```json
{"name":"iPhone 15 Pro","price":1299,"stock":10,
 "imagesUrl":["/img/products/iPhone 14 Pro.jpg"], "category":{}}
```

---

## 2. Arquitectura de servicios

Desde el **2026-10-20** todo el frontend consume la **API real** via `apiClient`.
Los mocks (`productService.js`, `categoryService.js`, `userService.js` y los JSON de
`src/data/`) se eliminaron; solo queda `src/data/homeImages.json`, que alimenta el banner.

| Servicio | Endpoints |
|---|---|
| `productsService.js` | `GET /products`, `GET /products/:id`, `GET /products/search?q=` |
| `categoriesService.js` | `GET /categories`, `GET /categories/:id`, `GET /products/search?category=` |
| `usersService.js` | `GET/PUT /users/:id` |
| `authService.js` | `POST /auth/login`, `POST /auth/register` (el refresh vive en `apiClient`) |
| `cartService.js` | `GET /cart/user/:id`, `PUT /cart/:id` |
| `paymentService.js` | `/payment-methods` (CRUD) |
| `shippingService.js` | `/addresses` (CRUD) |
| `orderService.js` | `POST /orders`, `GET /orders/my-orders` |

### Forma de datos

El campo de imagenes de producto es `imagesUrl` (array de strings tipo
`/img/products/...`) en el modelo Mongoose `Product`.

> Ojo: el modelo `Category` si usa `imageURL` (singular, string). Es otro campo,
> no es una inconsistencia.

---

## 3. Correcciones aplicadas

### Backend (`ecommerce-api/`)

| # | Archivo | Problema | Correccion |
|---|---|---|---|
| 1 | `.env` / `.env.example` | No existia `.env`; `PORT` caia al default 3000 y chocaba con CRA | `.env` creado; `PORT=4000` y `CORS_ORIGIN` agregados al ejemplo |
| 2 | `server.js` | `app.use(errorHandler)` estaba **antes** de las rutas. Express identifica los error handlers por aridad (4 args) y los corre en orden de registro, asi que **nunca capturaba nada** | Movido al final, despues de las rutas y del 404. Default port a 4000 y origen CORS por env |
| 3 | `src/middlewares/errorHandler.js:24` | `res.headerSent` — propiedad inexistente, siempre `undefined` | `res.headersSent` |
| 4 | `src/models/Product.js:9` | Declaraba `imageURL: String` mientras el seed insertaba `imagesUrl`. Mongoose en modo strict **descartaba el campo en silencio**: todos los productos salian sin imagen | `imagesUrl: { type: [String], default: ["/img/products/placeholder.svg"] }` |
| 5 | `src/controllers/productController.js` | `create` y `update` desestructuraban `imageURL` del body | Alineado a `imagesUrl` (4 sitios) |
| 6 | `src/seed/productsCategories.js` | Importaba `../models/category.js` y `../models/product.js` en minuscula. Funciona en Windows por el FS case-insensitive, **truena en Linux/macOS y en deploy** | `Category.js` y `Product.js` |
| 7 | `src/seed/productsCategories.js` | Rutas de imagen relativas `./img/products/...`; el front sirve desde `/img/...` | Cambiadas a `/img/products/...` |
| 8 | `src/controllers/cartController.js:160` | `populate("products.productId")` pero el schema `Cart` define el campo como `product`. Mongoose lanza `StrictPopulateError` — **`addProductToCart` fallaba** | `populate("products.product")` |
| 9 | `src/controllers/addressController.js:1` | `import Address from "../models/Address"` **sin extension `.js`** — `ERR_MODULE_NOT_FOUND` en ESM (`"type": "module"`). No reventaba el server solo porque nadie lo importa | Agregada la extension |
| 10 | `src/models/WhishList.js` | Typo en el nombre del archivo | Renombrado a `WishList.js` + import actualizado en `wishlistController.js` |

### Frontend (`ecommerce-app/`)

Solo se corrigieron bugs. **No se toco la arquitectura de servicios.**

| # | Archivo | Problema | Correccion |
|---|---|---|---|
| 11 | `src/components/Cart/CartView.jsx:20` | `item.imagesUrl[0]` sin guarda — **TypeError y pantalla en blanco** al agregar al carrito un producto sin imagenes | Encadenamiento opcional + fallback a placeholder + `onError`, igual que en `ProductCard` |
| 12 | `src/components/App/App.jsx` | La ruta `/settings` estaba declarada dos veces; la segunda era inalcanzable | Eliminada la duplicada |
| 13 | `package.json` | `prop-types` se importa en `Breadcrumb.jsx` pero no estaba en `dependencies` (resolvia transitivamente por react-scripts) | Declarado `^15.8.1` |

---

## 4. Evidencia de verificacion

Todo lo siguiente se ejecuto realmente, no es inferencia:

- **Backend arranca**: `Server running on http://localhost:4000` + `MongoDB connected localhost`
- **Seed corre**: `Datos de prueba insertados correctamente.` (9 productos, 4 categorias padre, 6 subcategorias)
- **`GET /api/products`** devuelve los productos con `imagesUrl` poblado correctamente
- **404 handler**: `GET /api/noexiste` responde `{"error":"Route not found","method":"GET","url":"/api/noexiste"}`
- **Validacion 422**: `GET /api/products/abc` responde el error de express-validator sobre el ObjectId
- **errorHandler ya funciona**: `GET /api/products/search?category=noesunid` responde HTTP 500 con
  `{"status":"error","message":"Internal Server Error"}` y escribe en `logs/error.log`.
  Antes de la correccion esto caia en la pagina HTML por defecto de Express
- **Frontend compila**: `npm run build` termina con exit 0 —
  `main.7500ce09.js` 114.98 kB gzip

---

## 5. Pendientes abiertos

Lo de la version anterior de esta seccion (rutas de direcciones, auth real con JWT,
`parentCategory` poblado, componentes leyendo JSON directo, el typo de `Setttings.jsx`
y los warnings de ESLint) ya quedo resuelto en la limpieza del 2026-10-20.

Funcionalidades por construir (no son codigo muerto):

1. `pages/Settings.jsx` — placeholder ruteado en `/settings`.
2. Newsletter — el submit solo hace `console.log`, no hay endpoint.
3. Links de `Navigation` (Ofertas, Novedades, Mas vendidos, Flash sale) y botones del
   banner apuntan a `/search` como placeholder; Footer usa `to="#"`.

Detalles conocidos:

4. Si `postalCode`/`phone` exceden el largo del modelo, la API responde 500 (error de
   Mongoose) en vez de 422; falta validarlos en `addressRoutes.js`.
5. Tarjetas creadas antes del 2026-10-20 pueden tener `cvv` guardado en la BD; el modelo
   ya no lo persiste. Limpieza: `db.paymentmethods.updateMany({}, { $unset: { cvv: 1 } })`.

---

## 6. Estructura de la API

Base: `http://localhost:4000/api`

| Recurso | Rutas | Notas |
|---|---|---|
| auth | `/auth/register`, `/auth/login`, `/auth/refresh` | bcrypt + JWT; expiraciones via `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` |
| products | `GET /products`, `GET /products/search`, `GET /products/:id`, `POST/PUT/DELETE /products` | Escrituras piden `authMiddleware` + `isAdmin` |
| categories | `GET /categories`, `GET /categories/:id`, `POST/PUT/DELETE` | Idem |
| cart | `/cart/...` | Solo el dueño o admin; `/cart/add` toma el usuario del token |
| orders | `/orders/...` | `GET /:id` dueño o admin; `PUT /:id` (estado) solo admin |
| payment methods | `/payment-methods/...` | Cada usuario ve/edita solo las suyas; no se guarda CVV |
| users | `/users/...` | |
| wishlist | `GET/POST /wishlist`, `DELETE /wishlist/products/:productId`, `GET /wishlist/all` (admin) | Usuario sacado del token; responde `{ products }`. Front: `wishlistService` + `WishlistContext` (corazon en `ProductCard`, pagina `/wishlist`) |
| addresses | `/addresses/...` | Siempre filtradas por el usuario del token |

Los `populate("user")` devuelven solo `name email` (nunca el hash de la contraseña).

`GET /products/search` responde `{ products, pagination }` (limit default 10),
distinto de `GET /products` que responde un array plano. Conviene tenerlo presente
al migrar el front.
