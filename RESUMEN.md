# Resumen de Pruebas E2E con Cypress (eShop)

Aquí tienes una explicación en palabras simples de lo que se instaló, qué se probó en el login de **eShop** y cómo quedó cada prueba.

---

## 1. ¿Qué se instaló y configuró?

- **Cypress (`cypress@^16.2.1`)** en `ecommerce-app/` como herramienta de pruebas de extremo a extremo (E2E).
- **`ecommerce-app/cypress.config.js`**: Configurado para apuntar a `http://localhost:3000` y buscar pruebas en `cypress/e2e/`.
- **Scripts en `ecommerce-app/package.json`**:
  - `npm run cy:open` / `npm run cypress:open` (modo interactivo)
  - `npm run cy:run` / `npm run cypress:run` (modo consola)
- **Escudo global para proteger tu base de datos (`ecommerce-app/cypress/support/e2e.js`)**:
  - Se configuró un `beforeEach` global que intercepta **todas** las peticiones (`POST`, `PUT`, `PATCH`, `DELETE` y `GET`) hacia `**/api/**`.
  - Así, aunque tengas tu backend (`localhost:4000`) y tu base de datos real prendidos mientras corres `npm run cy:run` o `npm run cy:open`, **ninguna prueba puede llegar al servidor ni sobrescribir tu base de datos**.

---

## 2. ¿Cómo funciona el Login real de eShop?

Antes de escribir el test, revisamos el flujo real en `LoginForm.jsx`, `auth.js`, `authService.js` y `Header.jsx`:

1. El usuario entra a `/login`, llena su correo (`#email`) y contraseña (`#password`) y presiona **"Iniciar Sesión"**.
2. El botón cambia a **"Iniciando sesión..."** y se deshabilita mientras envía `POST /api/auth/login`.
3. **Si las credenciales son válidas**:
   - El servidor devuelve un `token` JWT (que adentro trae `userId`, `name` y `role`) y un `refreshToken`.
   - El frontend guarda ambos en `localStorage`, redirige al inicio (`/`) y recarga la página.
   - El encabezado (`Header`) lee el token y muestra **"Hola, [Nombre del usuario]"** y **"Mi Cuenta"**.
4. **Si las credenciales son incorrectas**:
   - El servidor responde con error `400` (`{ message: "Invalid Credentials" }`).
   - El formulario muestra ese mensaje dentro de un recuadro de error (`.error-message`) y no guarda ningún token.

---

## 3. ¿Qué se probó en `cypress/e2e/login.cy.js`?

Para **no tocar la base de datos real**, usamos un usuario de prueba (`usuario.prueba@eshop.com`) e interceptamos las llamadas al backend con `cy.intercept`:

### Prueba 1: Login con credenciales correctas (Camino feliz)
- **Qué hace**:
  1. Abre `/login`.
  2. Escribe el correo `usuario.prueba@eshop.com` y la contraseña `Password123!`.
  3. Da clic en **"Iniciar Sesión"** y verifica que el botón pase al estado `"Iniciando sesión..."` deshabilitado.
  4. Recibe el token simulado del usuario de prueba.
  5. Comprueba que la aplicación redirige a la página principal (`/`), guarda `authToken` y `refreshToken` en `localStorage`, y muestra en el encabezado **"Hola, Usuario Prueba"** y **"Mi Cuenta"**.
- **Resultado**: **PASÓ EN VERDE** (`✓ 2159ms`).

### Prueba 2: Login con credenciales incorrectas (Camino de error)
- **Qué hace**:
  1. Abre `/login`.
  2. Escribe el correo `usuario.prueba@eshop.com` y una contraseña equivocada (`ClaveIncorrecta999`).
  3. Da clic en **"Iniciar Sesión"**.
  4. Comprueba que aparece el mensaje de error **`"Invalid Credentials"`** visible en pantalla (`.error-message`), que el usuario sigue en `/login` y que `authToken` en `localStorage` sigue vacío (`null`).
- **Resultado**: **PASÓ EN VERDE** (`✓ 1409ms`).

---

## 4. Resumen general de ejecución (`npm run cypress:run`)

| Archivo | Pruebas | Estado | Tiempo |
|---|---|---|---|
| `cypress/e2e/login.cy.js` | 2 (credenciales correctas + credenciales incorrectas) | **2 passing (Verde)** | ~3s |
| `cypress/e2e/smoke.cy.js` | 1 (carga de la página de inicio) | **1 passing (Verde)** | ~735ms |
| **Total** | **3 pruebas** | **3 passing (100% Verde)** | **~4s** |
