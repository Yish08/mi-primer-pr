# 🛒 E-commerce App - Proyecto Progresivo React 2025

## 📋 Descripción del Proyecto

Este es un proyecto de **e-commerce completo** que construiremos clase a clase durante el curso de React 2025. Cada semana añadiremos nuevas funcionalidades hasta tener una aplicación completamente funcional.

---

## 🎯 Objetivo Pedagógico

- **Aprendizaje incremental**: Cada clase construye sobre la anterior
- **Proyecto real**: Aplicación e-commerce con funcionalidades del mundo real
- **Buenas prácticas**: Código limpio, componentización y arquitectura escalable
- **Tecnologías modernas**: React Hooks, Context API, y herramientas actuales

---

## 🏗️ Estructura del Proyecto

```
ecommerce-app/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── BannerCarousel/
│   │   ├── Header/
│   │   ├── Footer/
│   │   ├── Layout/
│   │   └── ProductCard/
│   ├── pages/               # Páginas principales
│   │   ├── Home.jsx
│   │   ├── Products.jsx
│   │   ├── ProductDetail.jsx
│   │   └── Cart.jsx
│   ├── services/            # Lógica de servicios
│   │   └── productService.js
│   ├── data/                # Datos mock
│   │   ├── products.json
│   │   └── homeImages.json
│   ├── styles/              # Estilos globales
│   │   ├── index.css
│   │   └── variables.css
│   ├── App.jsx
│   └── index.js
├── package.json
└── README.md
```

---

## 🚀 Quick Start

### Prerequisitos
- Node.js (v22 o superior)
- npm o yarn
- Editor de código (VS Code recomendado)

### Instalación y Ejecución

```bash
# Clonar o descargar el proyecto
cd ecommerce-app

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm start

# Abrir en el navegador
# http://localhost:3000
```

### Scripts Disponibles

```bash
npm start          # Desarrollo
npm run build      # Construcción para producción
npm test           # Ejecutar tests
npm run lint       # Revisar código
```

---

## 📚 Tecnologías Utilizadas

### Core
- **React 18**: Biblioteca principal
- **React Router DOM**: Navegación y rutas
- **JavaScript ES6+**: Sintaxis moderna

### Desarrollo
- **Create React App**: Configuración inicial
- **CSS Modules**: Estilos encapsulados
- **JSON Mock Data**: Datos de prueba

### Futuras Integraciones
- **Context API**: Estado global
- **React Hook Form**: Manejo de formularios
- **Axios**: Cliente HTTP
- **React Query**: Cache y sincronización

---

## 🎨 Design System

### Colores
```css
:root {
  --primary: #007bff;
  --secondary: #6c757d;
  --success: #28a745;
  --danger: #dc3545;
  --warning: #ffc107;
  --info: #17a2b8;
  --light: #f8f9fa;
  --dark: #343a40;
}
```

### Breakpoints
```css
/* Mobile first approach */
--mobile: 480px;
--tablet: 768px;
--desktop: 1024px;
--large: 1200px;
```

---

## 🛠️ Comandos Útiles

### Desarrollo Diario
```bash
# Verificar que todo funciona
npm start

# Revisar errores
npm run build

# Limpiar cache si hay problemas
npm start -- --reset-cache
```

### Debugging
```bash
# Ver logs detallados
npm start --verbose

# Analizar bundle
npm run build
npx serve -s build
```

---

## 📋 Checklist Semanal

### Antes de cada Clase
- [ ] Proyecto funciona con `npm start`
- [ ] No hay errores en consola
- [ ] Todos los archivos están guardados
- [ ] Git está actualizado con los cambios

### Después de cada Clase
- [ ] Nuevas funcionalidades implementadas
- [ ] Tests manuales realizados
- [ ] Código documentado si es necesario
- [ ] Commit con mensaje descriptivo

---

## 🆘 Troubleshooting

### Problemas Comunes

#### Error: "Module not found"
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

#### Puerto 3000 ocupado
```bash
# Cambiar puerto
PORT=3001 npm start
```

#### Cambios no se reflejan
```bash
# Limpiar cache del navegador
# Ctrl+Shift+R (Windows/Linux)
# Cmd+Shift+R (Mac)
```

---

## 📈 Objetivos de Aprendizaje

Al finalizar este proyecto, los estudiantes habrán dominado:

### React Fundamentals
- ✅ Componentes funcionales
- ✅ Props y state
- ✅ Event handling
- ✅ Conditional rendering

### React Hooks
- ✅ useState
- ✅ useEffect
- ⏳ useContext
- ⏳ useReducer
- ⏳ Custom hooks

### Arquitectura y Patrones
- ✅ Component composition
- ✅ Container vs Presentational
- ⏳ Provider pattern
- ⏳ Higher-Order Components

### Herramientas y Ecosystem
- ✅ React Router
- ✅ CSS-in-JS
- ⏳ State management
- ⏳ API integration

---

## 🎯 Proyecto Final

El proyecto culminará en una **aplicación e-commerce completamente funcional** con:

- 🛍️ Catálogo de productos navegable
- 🛒 Carrito de compras persistente
- 👤 Autenticación de usuarios
- 💳 Proceso de checkout
- 📱 Diseño responsive
- ⚡ Performance optimizada

---

<div align="center">

**🏫 Curso:** Inadaptados React 2025
**👨‍💻 Instructor:** Rodrigo Leaños Bermejo
**📅 Periodo:** Septiembre - Diciembre 2025

---

**⭐ ¡Síguenos en este viaje construyendo un e-commerce desde cero! y obtengas el sueño deseado**

</div>