# Resultados de Remediación — Auditoría OWASP Top 10:2026 (`ecommerce-api`)

Registro secuencial de los 7 arreglos de severidad **ALTA** trabajados mediante `git worktree` en su propia rama, ejecutando la suite de pruebas (`npm test`) después de cada cambio.

| # | Arreglo | Categoría OWASP | Rama (`git worktree`) | Qué se hizo | Tests en verde |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 1 | `npm audit fix` de dependencias vulnerables | **A03:2026 — Software Supply Chain Failures** | `sec/deps-audit-fix` | Se ejecutó `npm audit fix` actualizando 18 paquetes en `package-lock.json` (`mongoose` → `9.12.1`, `express`, `body-parser`, `proxy-addr`, `qs`, `brace-expansion`), eliminando el 100% de las vulnerabilidades críticas y altas. *(Nota: quedan 4 moderadas en `glob`/`minimatch` de `swagger-jsdoc` y `nodemon` que requerirían `--force` con downgrade breaking).* | Sí (16/16) |
| 2 | Validación de entradas en Auth y `sanitizeFilter` | **A05:2026 — Injection** | `sec/auth-input-validation` | Se agregaron esquemas `express-validator` (`isString()`, `isEmail()`, `notEmpty()`) y el middleware `validate` en `/auth/register`, `/auth/login` y `/auth/refresh`, además de activar `mongoose.set("sanitizeFilter", true)` en `db.conf.js` y agregar pruebas con `{ "$ne": null }` y `{ "$regex": "^admin" }`. | Sí (17/17) |
