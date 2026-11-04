# Memoria del Proyecto — IntegracionFS2026-01

Monorepo del proyecto de comercio electrónico compuesto por `ecommerce-api` (backend) y `ecommerce-app` (frontend).

---

## 1. Estructura de carpetas de src/

### Backend: `ecommerce-api/src/`
*(Punto de entrada del servidor: `ecommerce-api/server.js`)*

```text
ecommerce-api/src/
├── config/
│   ├── cloudinary.conf.js
│   └── db.conf.js
├── controllers/
│   ├── addressController.js
│   ├── authController.js
│   ├── cartController.js
│   ├── categoryController.js
│   ├── orderController.js
│   ├── paymentMethodController.js
│   ├── productController.js
│   ├── uploadController.js
│   ├── userController.js
│   └── wishlistController.js
├── middlewares/
│   ├── authMiddleware.js
│   ├── errorHandler.js
│   ├── isAdminMiddleware.js
│   ├── isSelfOrAdminMiddleware.js
│   ├── logger.js
│   ├── uploadMiddleware.js
│   └── validation.js
├── models/
│   ├── Address.js
│   ├── Cart.js
│   ├── Category.js
│   ├── Order.js
│   ├── PaymentMethod.js
│   ├── Product.js
│   ├── User.js
│   └── WishList.js
├── routes/
│   ├── addressRoutes.js
│   ├── authRoutes.js
│   ├── cartRoutes.js
│   ├── categoryRoutes.js
│   ├── index.js
│   ├── orderRoutes.js
│   ├── paymentMethodRoutes.js
│   ├── productRoutes.js
│   ├── uploadRoutes.js
│   ├── userRoutes.js
│   └── wishlistRoutes.js
└── seed/
    └── productsCategories.js
```

### Frontend: `ecommerce-app/src/`

```text
ecommerce-app/src/
├── index.css
├── index.js
├── logo.svg
├── setupTests.js
├── components/
│   ├── Admin/
│   │   ├── ImageUpload/
│   │   │   ├── ImageUpload.css
│   │   │   └── ImageUpload.jsx
│   │   ├── ProductForm/
│   │   │   ├── ProductForm.css
│   │   │   └── ProductForm.jsx
│   │   └── ProductTable/
│   │       ├── ProductTable.css
│   │       └── ProductTable.jsx
│   ├── App/
│   │   ├── App.jsx
│   │   └── index.js
│   ├── BannerCarousel/
│   │   ├── BannerCarousel.css
│   │   ├── BannerCarousel.jsx
│   │   └── index.js
│   ├── Cart/
│   │   ├── CartView.css
│   │   ├── CartView.jsx
│   │   ├── StockNotice.css
│   │   └── StockNotice.jsx
│   ├── CategoryProducts/
│   │   ├── CategoryProducts.css
│   │   └── CategoryProducts.jsx
│   ├── Checkout/
│   │   ├── Address/
│   │   │   ├── AddressForm.css
│   │   │   ├── AddressForm.jsx
│   │   │   ├── AddressItem.css
│   │   │   ├── AddressItem.jsx
│   │   │   ├── AddressList.css
│   │   │   └── AddressList.jsx
│   │   ├── Payment/
│   │   │   ├── PaymentForm.css
│   │   │   ├── PaymentForm.jsx
│   │   │   ├── PaymentItem.css
│   │   │   ├── PaymentItem.jsx
│   │   │   ├── PaymentList.css
│   │   │   └── PaymentList.jsx
│   │   └── shared/
│   │       ├── SummarySection.css
│   │       └── SummarySection.jsx
│   ├── List/
│   │   ├── List.css
│   │   └── List.jsx
│   ├── LoginForm/
│   │   ├── LoginForm.css
│   │   └── LoginForm.jsx
│   ├── ProductCard/
│   │   ├── ProductCard.css
│   │   └── ProductCard.jsx
│   ├── ProductDetails/
│   │   ├── ProductDetails.css
│   │   └── ProductDetails.jsx
│   ├── ProfileCard/
│   │   ├── ProfileCard.css
│   │   ├── ProfileCard.jsx
│   │   └── ProfileForm.jsx
│   ├── RegisterForm/
│   │   ├── RegisterForm.css
│   │   └── RegisterForm.jsx
│   ├── SearchResultsList/
│   │   ├── SearchResultsList.css
│   │   └── SearchResultsList.jsx
│   ├── WishList/
│   │   ├── WishlistItem.css
│   │   └── WishlistItem.jsx
│   └── common/
│       ├── AddToCartButton/
│       │   ├── AddToCartButton.css
│       │   └── AddToCartButton.jsx
│       ├── Badge/
│       │   ├── Badge.css
│       │   ├── Badge.jsx
│       │   └── index.js
│       ├── Button/
│       │   ├── Button.css
│       │   ├── Button.jsx
│       │   └── index.js
│       ├── ErrorMessage/
│       │   ├── ErrorMessage.css
│       │   └── ErrorMessage.jsx
│       ├── Icon/
│       │   ├── Icon.css
│       │   └── Icon.jsx
│       ├── Input/
│       │   ├── Input.css
│       │   ├── Input.jsx
│       │   └── index.js
│       └── Loading/
│           ├── Loading.css
│           └── Loading.jsx
├── context/
│   ├── CartContext.jsx
│   ├── ThemeContext.jsx
│   └── WishlistContext.jsx
├── data/
│   └── homeImages.json
├── layout/
│   ├── Breadcrumb/
│   │   ├── Breadcrumb.css
│   │   └── Breadcrumb.jsx
│   ├── Footer/
│   │   ├── Footer.css
│   │   └── Footer.jsx
│   ├── Header/
│   │   ├── Header.css
│   │   └── Header.jsx
│   ├── Layout.css
│   ├── Layout.jsx
│   ├── Navigation/
│   │   ├── Navigation.css
│   │   └── Navigation.jsx
│   └── Newsletter/
│       ├── Newsletter.css
│       └── Newsletter.jsx
├── pages/
│   ├── AdminProductForm.jsx
│   ├── AdminProducts.css
│   ├── AdminProducts.jsx
│   ├── Cart.css
│   ├── Cart.jsx
│   ├── CategoryPage.jsx
│   ├── Checkout.css
│   ├── Checkout.jsx
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── OrderConfirmation.css
│   ├── OrderConfirmation.jsx
│   ├── Orders.css
│   ├── Orders.jsx
│   ├── Product.jsx
│   ├── Profile.jsx
│   ├── ProtectedRoute.jsx
│   ├── Register.jsx
│   ├── SearchResults.jsx
│   ├── Settings.jsx
│   ├── WishList.css
│   └── WishList.jsx
├── services/
│   ├── apiClient.js
│   ├── authService.js
│   ├── cartService.js
│   ├── categoriesService.js
│   ├── orderService.js
│   ├── paymentService.js
│   ├── productsService.js
│   ├── shippingService.js
│   ├── uploadService.js
│   ├── usersService.js
│   └── wishlistService.js
└── utils/
    ├── auth.js
    ├── carryToCart.css
    ├── carryToCart.js
    ├── flyToCart.css
    └── flyToCart.js
```

---

## 2. Mapa de rutas del backend

Todas las rutas de la API están montadas sobre el prefijo `/api` (definido en `server.js: app.use("/api", routes)`).

| Método | Path | Auth requerida | Admin requerido / Reglas de acceso |
|---|---|---|---|
| **Auth** (`/api/auth`) | | | |
| POST | `/api/auth/register` | No | Público |
| POST | `/api/auth/login` | No | Público |
| POST | `/api/auth/refresh` | No | Público |
| **Productos** (`/api/products`) | | | |
| GET | `/api/products/search` | No | Público |
| GET | `/api/products` | No | Público |
| GET | `/api/products/:id` | No | Público |
| POST | `/api/products` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| PUT | `/api/products/:id` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| DELETE | `/api/products/:id` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| **Categorías** (`/api/categories`) | | | |
| GET | `/api/categories` | No | Público |
| GET | `/api/categories/:id` | No | Público |
| POST | `/api/categories` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| PUT | `/api/categories/:id` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| DELETE | `/api/categories/:id` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| **Carrito** (`/api/cart`) | | | |
| GET | `/api/cart` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| GET | `/api/cart/:id` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| GET | `/api/cart/user/:id` | Sí (`authMiddleware`) | Sí (`isSelfOrAdmin`: solo el propio usuario o admin) |
| POST | `/api/cart` | Sí (`authMiddleware`) | No |
| PUT | `/api/cart/:id` | Sí (`authMiddleware`) | No |
| DELETE | `/api/cart/:id` | Sí (`authMiddleware`) | No |
| POST | `/api/cart/add` | Sí (`authMiddleware`) | No (agrega producto para el usuario del token) |
| **Órdenes** (`/api/orders`) | | | |
| GET | `/api/orders` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| GET | `/api/orders/my-orders` | Sí (`authMiddleware`) | No (órdenes del usuario autenticado) |
| GET | `/api/orders/:id` | Sí (`authMiddleware`) | Valida en controlador: dueño de la orden o admin |
| POST | `/api/orders` | Sí (`authMiddleware`) | No |
| PUT | `/api/orders/:id` | Sí (`authMiddleware`) | Sí (`isAdmin`: actualiza estado o pago) |
| **Métodos de pago** (`/api/payment-methods`) | | | |
| GET | `/api/payment-methods` | Sí (`authMiddleware`) | No (métodos del usuario autenticado) |
| GET | `/api/payment-methods/:id` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| POST | `/api/payment-methods` | Sí (`authMiddleware`) | No (asociado al usuario del token) |
| PUT | `/api/payment-methods/:id` | Sí (`authMiddleware`) | No (el controlador valida propiedad o admin) |
| DELETE | `/api/payment-methods/:id` | Sí (`authMiddleware`) | No (el controlador valida propiedad o admin) |
| **Direcciones** (`/api/addresses`) | | | |
| GET | `/api/addresses` | Sí (`authMiddleware`) | No (direcciones del usuario autenticado) |
| GET | `/api/addresses/:id` | Sí (`authMiddleware`) | No (el controlador valida propiedad o admin) |
| POST | `/api/addresses` | Sí (`authMiddleware`) | No (asociada al usuario del token) |
| PUT | `/api/addresses/:id` | Sí (`authMiddleware`) | No (el controlador valida propiedad o admin) |
| DELETE | `/api/addresses/:id` | Sí (`authMiddleware`) | No (el controlador valida propiedad o admin) |
| **Usuarios** (`/api/users`) | | | |
| GET | `/api/users` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| GET | `/api/users/:id` | Sí (`authMiddleware`) | Sí (`isSelfOrAdmin`: solo el propio usuario o admin) |
| POST | `/api/users` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| PUT | `/api/users/:id` | Sí (`authMiddleware`) | Sí (`isSelfOrAdmin`: solo el propio usuario o admin) |
| DELETE | `/api/users/:id` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| **Lista de deseos** (`/api/wishlist`) | | | |
| GET | `/api/wishlist` | Sí (`authMiddleware`) | No (wishlist del usuario del token) |
| POST | `/api/wishlist` | Sí (`authMiddleware`) | No (agrega producto para el usuario del token) |
| DELETE | `/api/wishlist/products/:productId` | Sí (`authMiddleware`) | No (remueve producto para el usuario del token) |
| GET | `/api/wishlist/all` | Sí (`authMiddleware`) | Sí (`isAdmin`) |
| GET | `/api/wishlist/user/:id` | Sí (`authMiddleware`) | Sí (`isSelfOrAdmin`: solo el propio usuario o admin) |
| DELETE | `/api/wishlist/:id` | Sí (`authMiddleware`) | No (el controlador valida propiedad o admin) |
| **Subida de imágenes** (`/api/upload`) | | | |
| POST | `/api/upload` | Sí (`authMiddleware`) | Sí (`isAdmin` + middleware `uploadMiddleware`) |

---

## 3. Modelos de Mongoose y sus campos principales

Todos los modelos definen `{ timestamps: true }` (`createdAt` y `updatedAt`).

- **`Address`** (`src/models/Address.js`):
  - `user`: ObjectId (ref: `'User'`, required)
  - `name`: String (required, trim)
  - `address`: String (required, trim)
  - `city`: String (required, trim)
  - `state`: String (trim)
  - `postalCode`: String (required, minLength: 4, maxLength: 6, trim)
  - `country`: String (required, trim)
  - `phone`: String (maxLength: 10, trim)
  - `isDefault`: Boolean (default: `false`)
  - `addressType`: String (enum: `["home", "work", "other"]`, default: `"home"`)

- **`Cart`** (`src/models/Cart.js`):
  - `user`: ObjectId (ref: `'User'`, required)
  - `products`: Array de subdocumentos:
    - `product`: ObjectId (ref: `'Product'`, required)
    - `quantity`: Number (required, min: 1)

- **`Category`** (`src/models/Category.js`):
  - `name`: String (required, trim)
  - `description`: String (required)
  - `imageURL`: String (required, default: `"https://placehold.co/800x600.png"`)
  - `parentCategory`: ObjectId (ref: `'Category'`, default: `null`)

- **`Order`** (`src/models/Order.js`):
  - `user`: ObjectId (ref: `'User'`, required)
  - `products`: Array de subdocumentos:
    - `productId`: ObjectId (ref: `'Product'`, required)
    - `quantity`: Number (required, min: 1)
    - `price`: Number (required)
  - `address`: ObjectId (ref: `'Address'`, required)
  - `paymentMethod`: ObjectId (ref: `'PaymentMethod'`, required)
  - `shippingCost`: Number (required, default: `0`)
  - `totalPrice`: Number (required)
  - `status`: String (enum: `["pending", "processing", "shipped", "delivered", "cancelled"]`, default: `"pending"`)
  - `paymentStatus`: String (enum: `["pending", "paid", "failed", "refunded"]`, default: `"pending"`)

- **`PaymentMethod`** (`src/models/PaymentMethod.js`):
  - `user`: ObjectId (ref: `'User'`, required)
  - `type`: String (required, enum: `["credit_card", "debit_card", "paypal", "bank_transfer", "cash_on_delivery"]`)
  - `cardNumber`: String (maxLength: 19)
  - `cardHolderName`: String (trim)
  - `expiryDate`: String
  - `paypalEmail`: String
  - `bankName`: String
  - `accountNumber`: String
  - `isDefault`: Boolean (default: `false`)

- **`Product`** (`src/models/Product.js`):
  - `name`: String (required, trim)
  - `description`: String
  - `price`: Number (required)
  - `stock`: Number (default: `0`)
  - `imagesUrl`: Array de String (default: `["/img/products/placeholder.svg"]`)
  - `category`: ObjectId (ref: `'Category'`)

- **`User`** (`src/models/User.js`):
  - `name`: String (required, trim)
  - `email`: String (required, unique, trim, lowercase)
  - `password`: String (required)
  - `phone`: String (trim)
  - `role`: String (enum: `["customer", "admin"]`, default: `"customer"`)

- **`WishList`** (`src/models/WishList.js`):
  - `user`: ObjectId (ref: `'User'`, required)
  - `products`: Array de ObjectId (ref: `'Product'`, required)

---

## 4. Middlewares de seguridad

1. **`authMiddleware`** (`src/middlewares/authMiddleware.js`):
   - Lee el header `Authorization: Bearer <TOKEN>`.
   - Si no existe el token, responde HTTP `401 Unauthorized`.
   - Verifica el token mediante `jwt.verify(token, process.env.JWT_SECRET)`.
   - Si el token expiró o es inválido, responde HTTP `401 Invalid or expired token`.
   - Si es válido, asigna el payload decodificado a `req.user` y continúa con `next()`.

2. **`isAdmin`** (`src/middlewares/isAdminMiddleware.js`):
   - Comprueba la existencia de `req.user` (responde `401 Authentication is required` si falta).
   - Comprueba que `req.user.role === "admin"`.
   - Si no tiene rol `admin`, responde HTTP `403 Admin access required`.

3. **`isSelfOrAdmin`** (`src/middlewares/isSelfOrAdminMiddleware.js`):
   - Comprueba la existencia de `req.user` (responde `401 Authentication is required` si falta).
   - Compara `String(req.user.userId) === req.params.id`.
   - Si el ID no coincide y el usuario no tiene rol `admin`, responde HTTP `403 Access denied`.

---

## 5. Patrón de código del proyecto

- **Backend (`ecommerce-api`)**:
  - **ES Modules nativo**: `"type": "module"` en `package.json`. Todos los imports internos de archivos relativos incluyen extensión `.js`.
  - **Estructura en capas**:
    - `routes/`: Enrutamiento y validaciones de esquema con `express-validator`.
    - `controllers/`: Lógica de negocio y manejo de peticiones HTTP.
    - `models/`: Esquemas de datos con Mongoose.
    - `middlewares/`: Autenticación, autorización, validación, subida con Multer (`uploadMiddleware.js`), logging (`logger.js`) y manejo centralizado de errores (`errorHandler.js`).
    - `config/`: Configuración de base de datos (`db.conf.js`) y Cloudinary (`cloudinary.conf.js`).

- **Frontend (`ecommerce-app`)**:
  - **Componentes funcionales con Hooks**: Uso de hooks estándar (`useState`, `useEffect`, `useContext`) y custom hooks.
  - **Gestión de estado global**: Implementado mediante React Context API (`CartContext`, `WishlistContext`, `ThemeContext`).
  - **Enrutamiento**: React Router v7 (`BrowserRouter`, `Routes`, `Route`, `Navigate`, `Outlet`, `useNavigate`, `useParams`). Rutas protegidas controladas con el componente `src/pages/ProtectedRoute.jsx`.
  - **Servicios con Axios**:
    - Centralizados en `src/services/`.
    - Cliente base `src/services/apiClient.js` configurado con `baseURL: "http://localhost:4000/api"`.
    - Interceptor de petición inyecta `Authorization: Bearer <token>` desde `localStorage.getItem("authToken")`.
    - Interceptor de respuesta captura errores `401` y ejecuta el refresco automático contra `/api/auth/refresh` con `refreshToken`. Si falla, limpia el almacenamiento y redirige a `/login`.
    - Servicios por entidad (`productsService.js`, `cartService.js`, `authService.js`, etc.) invocan métodos de `apiClient`.
  - **Estilos**: Vanilla CSS modular organizado por componente (`NombreComponente.jsx` acompañado de `NombreComponente.css`).

---

## 6. Testing

Reglas obligatorias para pruebas en este proyecto:

- **Runner y Librerías**:
  - El frontend está construido sobre Create React App (`react-scripts 5.0.1`).
  - Los tests se corren exclusivamente con:
    ```bash
    npm test
    ```
    *(Ejecuta **Jest** junto con **React Testing Library** configurado en `src/setupTests.js`. **NO usar Vitest**).*
- **Ubicación de los tests**:
  - Los tests de componentes deben colocarse en la misma carpeta del componente bajo prueba (co-located):
    ```text
    src/components/NombreComponente/
    ├── NombreComponente.jsx
    ├── NombreComponente.css
    └── NombreComponente.test.jsx
    ```
- **Filosofía de prueba**:
  - Se prueba el comportamiento visible para el usuario (textos, botones, interacciones, cambios de estado en la UI).
  - NO se prueban detalles internos de implementación ni estados privados de los componentes.
