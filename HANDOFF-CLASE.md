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

## 2. Arquitectura de servicios — LEER ANTES DE TOCAR NADA

En `ecommerce-app/src/services/` conviven **a proposito** dos servicios de productos.
No son un duplicado por error y **no deben fusionarse ni borrarse**:

| Servicio | Fuente | Consumidores |
|---|---|---|
| `productService.js` (singular) | mockup `src/data/products.json` | ProductDetails, SearchResultsList, Home (import presente, sin uso) |
| `productsService.js` (plural) | **API real** via `apiClient` | Home |

La convivencia mock/API es deliberada para el curso: permite comparar o intercambiar
la fuente de datos en clase. Los nombres solo difieren en una "s", asi que es facil
confundirlos con un error.

Los demas servicios siguen en mockup y **no fueron migrados**:

| Servicio | Estado | Existe endpoint en la API? |
|---|---|---|
| `categoryService.js` | mock | Si — `GET /api/categories` |
| `userService.js` | mock | Si — `/api/users`, `/api/auth` |
| `paymentService.js` | mock | Si — `/api/payment-methods` |
| `shippingService.js` | mock | **No** — falta `addressRoutes.js` |

Migrarlos es candidato natural a ejercicio de clase (ver seccion 5).

### Forma de datos compartida

El campo de imagenes de producto es `imagesUrl` (array de strings tipo
`/img/products/...`) **tanto en el mock como en la API**. Eso es lo que permite
intercambiar fuentes sin tocar componentes. Si se agregan campos a `Product`, hay que
reflejarlos con el mismo nombre en `src/data/products.json` y en el modelo Mongoose.

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

## 5. Lo que NO se corrigio (candidatos a ejercicio de clase)

Ninguno rompe el arranque. Se dejaron a proposito porque son decisiones de diseño del
profesor, no bugs.

### Estructurales

1. **No existe `addressRoutes.js`.** El `addressController.js` esta completo
   (`getUserAddresses`, `getAddressById`, `createAddress`, `updateAddress`,
   `deleteAddress`) pero ninguna ruta lo expone. Es un hueco real: el modelo `Order`
   declara `address` como **required**, asi que no se pueden crear ordenes de punta a
   punta. Cablear estas rutas es un ejercicio natural.

2. **Auth del frontend es falsa.** `src/utils/auth.js` valida contra un objeto
   hardcodeado (`admin@email.com` / `admin123`) y genera el "token" con `btoa()`.
   El backend ya tiene `/api/auth` con bcrypt y JWT funcionando, pero el front lo
   ignora por completo. Migrar esto es probablemente la practica mas jugosa.

3. **Diferencia de forma en `category.parentCategory`.**
   - Mock: objeto anidado completo
   - API: string (ObjectId sin populate)

   `Navigation.jsx:16` hace `cat.parentCategory._id`. Funciona hoy porque
   `Navigation` lee `categories.json` directo, pero **rompera al migrar categorias a
   la API**. Se resuelve con un `.populate("parentCategory")` en `categoryController`
   o normalizando en el servicio del front.

4. **Componentes que saltan la capa de servicios** e importan el mock directo:
   `layout/Navigation/Navigation.jsx:4` y
   `components/ProductDetails/ProductDetails.jsx:4` importan `categories.json`.

### Cosmeticos

5. `src/pages/Setttings.jsx` — typo, tres "t". Se dejo sin renombrar para no mover
   archivos del front sin autorizacion; el import en `App.jsx` lo referencia asi.

6. **4 warnings de ESLint** en el build (ninguno es error):
   - `SearchResultsList.jsx:61` — `handleQueryChange` definido y nunca usado
     (el input de busqueda al parecer quedo sin cablear)
   - `CartContext.jsx:18` — `total` asignado y nunca usado
   - `Checkout.jsx:61` — `useEffect` con dependencia faltante `isOrderFinished`
   - `Home.jsx:7` — `fetchProducts` importado y nunca usado. **Este es intencional**:
     es el import del mock que convive con el de la API (ver seccion 2)

---

## 6. Estructura de la API

Base: `http://localhost:4000/api`

| Recurso | Rutas | Notas |
|---|---|---|
| auth | `/auth/...` | bcrypt + JWT, funcional, sin usar por el front |
| products | `GET /products`, `GET /products/search`, `GET /products/:id`, `POST/PUT/DELETE /products` | Escrituras piden `authMiddleware` + `isAdmin` |
| categories | `GET /categories`, `GET /categories/:id`, `POST/PUT/DELETE` | Idem |
| cart | `/carts/...` | |
| orders | `/orders/...` | Requiere `address`, que no tiene rutas |
| payment methods | `/payment-methods/...` | |
| users | `/users/...` | |
| wishlist | `/wishlists/...` | |
| **addresses** | — | **Controller existe, rutas NO** |

`GET /products/search` responde `{ products, pagination }` (limit default 10),
distinto de `GET /products` que responde un array plano. Conviene tenerlo presente
al migrar el front.
