import "./flyToCart.css";

// Efecto "del corazon al carrito".
// La foto del producto se despega de su fila convertida en burbuja, vuela en
// arco hasta el carrito del Header dejando una estela de corazones en los
// colores de la marca y, al aterrizar, el carrito rebota con una onda,
// chispas y un "+1".
//
// Es puramente visual: crea elementos temporales en <body> y los anima con la
// Web Animations API, por eso vive fuera de React. La promesa que devuelve se
// resuelve al aterrizar, para sincronizar ahi la logica del carrito; si no hay
// animacion posible (reducir movimiento, carrito oculto) se resuelve de
// inmediato.
//
// Las utilidades exportadas (curvas, chispas y el festejo de llegada) tambien
// las usa carryToCart.js, el efecto del boton "Agregar al carrito".

export const BRAND_COLORS = ["--color-pink", "--color-purple", "--color-blue", "--color-yellow"];

const HEART_SVG =
  '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';

const LIFT_END = 0.16; // fraccion del vuelo dedicada a "despegar"
const PATH_STEPS = 28; // muestras de la curva; WAAPI interpola entre ellas
const BUBBLE_END_SIZE = 26; // px de la burbuja al llegar al carrito

export const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

// Una animacion puede no terminar nunca (pestaña en segundo plano, se
// cancela); la logica del carrito no puede quedarse esperando: hay un tope.
export const waitForAnimation = (animation, maxMs) =>
  Promise.race([
    animation.finished.catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, maxMs)),
  ]);

export const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

// Punto t (0..1) de una curva de Bezier cuadratica
export const bezier = (from, control, to, t) =>
  (1 - t) ** 2 * from + 2 * (1 - t) * t * control + t ** 2 * to;

export const centerOf = (rect) => ({
  x: rect.left + rect.width / 2,
  y: rect.top + rect.height / 2,
});

export const toTransform = ({ x, y, scale, rotate }) =>
  `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${scale.toFixed(3)}) rotate(${rotate.toFixed(1)}deg)`;

export function spawnAt(className, { x, y }) {
  const element = document.createElement("span");
  element.className = className;
  element.setAttribute("aria-hidden", "true");
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
  document.body.appendChild(element);
  return element;
}

export function animateAndRemove(element, keyframes, options) {
  const animation = element.animate(keyframes, { fill: "forwards", ...options });
  waitForAnimation(animation, options.duration + 300).then(() => element.remove());
}

export function flyToCart(image) {
  const target = document.querySelector("[data-cart-target]");
  if (!image || !target || !image.animate || prefersReducedMotion()) {
    return Promise.resolve();
  }

  const from = image.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (!from.width || !to.width) return Promise.resolve();

  const start = centerOf(from);
  const end = centerOf(to);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const duration = Math.round(
    Math.min(1150, Math.max(800, 550 + Math.hypot(dx, dy) * 0.45))
  );
  const accentRgb =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--accent-rgb")
      .trim() || "38, 51, 108";

  // Exterior: viaja (translate/scale/rotate). Interior: pasa de foto cuadrada
  // a burbuja redonda con aro blanco y brillo del color acento del tema.
  const bubble = document.createElement("div");
  bubble.className = "fly-to-cart-bubble";
  bubble.setAttribute("aria-hidden", "true");
  Object.assign(bubble.style, {
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
  });
  const inner = document.createElement("div");
  inner.className = "fly-to-cart-bubble-inner";
  const photo = document.createElement("img");
  photo.src = image.currentSrc || image.src;
  photo.alt = "";
  inner.appendChild(photo);
  bubble.appendChild(inner);
  document.body.appendChild(bubble);

  // La foto original "se despega" de la fila
  image.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: "forwards" });

  inner.animate(
    [
      {
        borderRadius: "6px",
        boxShadow: `0 0 0 0px rgba(255, 255, 255, 0), 0 0 0px rgba(${accentRgb}, 0)`,
      },
      {
        borderRadius: "50%",
        boxShadow: `0 0 0 3px rgba(255, 255, 255, 1), 0 14px 32px rgba(${accentRgb}, 0.55)`,
      },
    ],
    { duration: duration * LIFT_END * 1.5, easing: "ease-out", fill: "forwards" }
  );

  // Despega (sube un poco, crece y se inclina) y luego recorre un arco cuyo
  // punto de control queda por encima del carrito: sube, cruza y "cae" dentro.
  const lift = { x: 0, y: -14, scale: 1.12, rotate: -6 };
  const control = { x: dx * 0.25, y: dy - 90 };
  const endScale = BUBBLE_END_SIZE / from.width;

  const frames = [
    {
      offset: 0,
      easing: "cubic-bezier(0.2, 0.8, 0.3, 1)",
      transform: toTransform({ x: 0, y: 0, scale: 1, rotate: 0 }),
    },
    { offset: LIFT_END, transform: toTransform(lift) },
  ];
  for (let step = 1; step <= PATH_STEPS; step++) {
    const t = easeInOutCubic(step / PATH_STEPS);
    frames.push({
      offset: Math.min(1, LIFT_END + (1 - LIFT_END) * (step / PATH_STEPS)),
      transform: toTransform({
        x: bezier(lift.x, control.x, dx, t),
        y: bezier(lift.y, control.y, dy, t),
        scale: lift.scale + (endScale - lift.scale) * t,
        rotate: bezier(lift.rotate, 24, 0, t),
      }),
    });
  }

  const flight = bubble.animate(frames, { duration, easing: "linear", fill: "forwards" });
  startHeartTrail(bubble, flight, duration);

  return waitForAnimation(flight, duration + 500).then(() => {
    absorb(bubble, inner);
    celebrate(target);
  });
}

// Estela: un corazoncito cada ~55 ms en la posicion actual de la burbuja,
// que cae, gira y se desvanece.
function startHeartTrail(bubble, flight, duration) {
  let lastSpawn = 0;
  let count = 0;

  const tick = (now) => {
    if (flight.playState !== "running" || !bubble.isConnected) return;
    const progress = (flight.currentTime || 0) / duration;
    if (progress > LIFT_END && progress < 0.9 && now - lastSpawn > 55) {
      lastSpawn = now;
      spawnHeart(
        centerOf(bubble.getBoundingClientRect()),
        BRAND_COLORS[count++ % BRAND_COLORS.length]
      );
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function spawnHeart(point, colorVar) {
  const heart = spawnAt("fly-to-cart-heart", point);
  heart.innerHTML = HEART_SVG;
  heart.style.color = `var(${colorVar})`;
  const size = 0.75 + Math.random() * 0.4;
  const driftX = (Math.random() - 0.5) * 28;
  const driftY = 12 + Math.random() * 18;
  const spin = (Math.random() - 0.5) * 70;
  animateAndRemove(
    heart,
    [
      { transform: `translate(0px, 0px) scale(${size.toFixed(2)}) rotate(0deg)`, opacity: 1 },
      {
        transform: `translate(${driftX.toFixed(1)}px, ${driftY.toFixed(1)}px) scale(0.3) rotate(${spin.toFixed(1)}deg)`,
        opacity: 0,
      },
    ],
    { duration: 900, easing: "cubic-bezier(0.2, 0.7, 0.4, 1)" }
  );
}

// La burbuja se encoge "dentro" del carrito y desaparece
function absorb(bubble, inner) {
  const shrink = inner.animate(
    [
      { transform: "scale(1)", opacity: 1 },
      { transform: "scale(0.2)", opacity: 0 },
    ],
    { duration: 220, easing: "ease-in", fill: "forwards" }
  );
  waitForAnimation(shrink, 600).then(() => bubble.remove());
}

// Aterrizaje: el carrito atrapa el producto con un rebote, una onda, chispas
// de colores y un "+1" que sube.
export function celebrate(target) {
  const point = centerOf(target.getBoundingClientRect());

  target.animate(
    [
      { transform: "scale(1) rotate(0deg)" },
      { transform: "scale(1.3) rotate(-10deg)", offset: 0.3 },
      { transform: "scale(0.92) rotate(6deg)", offset: 0.6 },
      { transform: "scale(1.05) rotate(-2deg)", offset: 0.8 },
      { transform: "scale(1) rotate(0deg)" },
    ],
    { duration: 600, easing: "ease-out" }
  );

  animateAndRemove(
    spawnAt("fly-to-cart-ring", point),
    [
      { transform: "scale(0.4)", opacity: 0.9 },
      { transform: "scale(2.4)", opacity: 0 },
    ],
    { duration: 650, easing: "cubic-bezier(0.2, 0.8, 0.3, 1)" }
  );

  const SPARKS = 10;
  for (let i = 0; i < SPARKS; i++) {
    const angle = (i / SPARKS) * Math.PI * 2 + Math.random() * 0.5;
    const reach = 26 + Math.random() * 22;
    const spark = spawnAt("fly-to-cart-spark", point);
    spark.style.background = `var(${BRAND_COLORS[i % BRAND_COLORS.length]})`;
    animateAndRemove(
      spark,
      [
        { transform: "translate(0px, 0px) scale(1)", opacity: 1 },
        {
          transform: `translate(${(Math.cos(angle) * reach).toFixed(1)}px, ${(Math.sin(angle) * reach).toFixed(1)}px) scale(0.3)`,
          opacity: 0,
        },
      ],
      { duration: 550 + Math.random() * 250, easing: "cubic-bezier(0.15, 0.8, 0.3, 1)" }
    );
  }

  // A la izquierda del carrito: arriba no hay espacio (el Header esta pegado
  // al borde) y a la derecha taparia el badge.
  const plus = spawnAt("fly-to-cart-plus", { x: point.x - 30, y: point.y - 2 });
  plus.textContent = "+1";
  animateAndRemove(
    plus,
    [
      { transform: "translate(-50%, 0px) scale(0.6)", opacity: 0 },
      { transform: "translate(-50%, -8px) scale(1.1)", opacity: 1, offset: 0.25 },
      { transform: "translate(-50%, -20px) scale(1)", opacity: 0 },
    ],
    { duration: 950, easing: "ease-out" }
  );
}
