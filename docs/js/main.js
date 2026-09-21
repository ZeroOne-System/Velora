/* ======================================================
   VELORA — main.js
   Solo BMW M. Todo el sitio lee de un único arreglo: CARS.
   ====================================================== */

const CART_KEY = "velora_cart";
const AUTH_KEY = "velora_user";

/* ------------------------------------------------------
   1. CATÁLOGO (solo BMW M)
   Las imágenes son las que recortaste y viven en
   assets/cars/ dentro del propio proyecto.
   ------------------------------------------------------ */
const CARS = [
  { id: "bmw-m2", name: "BMW M2", desc: "El más compacto y ágil de la familia M. Tracción trasera pura.", price: 65200, hp: 460, accel: "4.1s", top: "250 km/h", image: "assets/cars/m2.png" },
  { id: "bmw-m3", name: "BMW M3 Competition", desc: "6 cilindros en línea Twin-Turbo. Precisión alemana en su forma más pura.", price: 76500, hp: 510, accel: "3.5s", top: "290 km/h", image: "assets/cars/m3.png" },
  { id: "bmw-m4", name: "BMW M4 Competition", desc: "Coupé deportivo con tracción xDrive opcional y presencia total.", price: 81900, hp: 503, accel: "3.4s", top: "290 km/h", image: "assets/cars/m4.png" },
  { id: "bmw-m5", name: "BMW M5", desc: "Berlina híbrida de alto rendimiento con tracción integral M xDrive.", price: 114500, hp: 727, accel: "3.1s", top: "305 km/h", image: "assets/cars/m5.png" },
  { id: "bmw-m8", name: "BMW M8 Competition", desc: "El buque insignia de M. Gran turismo de dos puertas, V8 biturbo.", price: 145900, hp: 617, accel: "3.2s", top: "305 km/h", image: "assets/cars/m8.png" }
];

// Fotos reales para el carrusel de inicio (no son recortes, son fotografías
// completas). Los textos son genéricos a propósito: no identifican el modelo.
const GALLERY = [
  { image: "assets/carousel/slide1.jpg", caption: "Presencia que impone, incluso de noche." },
  { image: "assets/carousel/slide2.jpg", caption: "Hecho para la carretera, pase lo que pase." },
  { image: "assets/carousel/slide3.jpg", caption: "Diseño que se nota en cualquier lugar." },
  { image: "assets/carousel/slide4.jpg", caption: "Velocidad y precisión en cada curva." }
];

function getCarById(id) {
  return CARS.find(car => car.id === id);
}

function formatPrice(value) {
  return "$" + Number(value).toLocaleString("en-US");
}

/* ------------------------------------------------------
   2. CARRITO (guarda solo id + cantidad)
   ------------------------------------------------------ */

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(id) {
  const cart = getCart();
  const existente = cart.find(item => item.id === id);

  if (existente) {
    existente.qty += 1;
  } else {
    cart.push({ id: id, qty: 1 });
  }

  saveCart(cart);
  updateCartCount();
}

function removeFromCart(id) {
  const cart = getCart().filter(item => item.id !== id);
  saveCart(cart);
  renderCart();
  updateCartCount();
}

function updateCartCount() {
  document.querySelectorAll("#cart-count").forEach(badge => {
    const total = getCart().reduce((suma, item) => suma + item.qty, 0);
    badge.textContent = total > 0 ? `(${total})` : "";
  });
}

function renderCart() {
  const contenedor = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  if (!contenedor) return; // solo aplica en carrito.html

  const cart = getCart();

  if (cart.length === 0) {
    contenedor.innerHTML = `
      <div class="cart__empty">
        <p>Tu carrito está vacío.</p>
        <a href="modelos.html">Ver catálogo</a>
      </div>`;
    totalEl.textContent = formatPrice(0);
    return;
  }

  let html = "";
  let total = 0;

  cart.forEach(item => {
    const car = getCarById(item.id);
    if (!car) return;
    total += car.price * item.qty;

    html += `
      <div class="cart__item">
        <img src="${car.image}" alt="${car.name}">
        <div class="cart__item-info">
          <h3>${car.name} ${item.qty > 1 ? "x" + item.qty : ""}</h3>
          <p>${formatPrice(car.price)} c/u</p>
        </div>
        <button class="cart__remove" data-remove="${car.id}" aria-label="Eliminar">✕</button>
      </div>
    `;
  });

  contenedor.innerHTML = html;
  totalEl.textContent = formatPrice(total);

  contenedor.querySelectorAll("[data-remove]").forEach(btn =>
    btn.addEventListener("click", () => removeFromCart(btn.dataset.remove)));
}

/* ------------------------------------------------------
   3. CATÁLOGO (modelos.html)
   Cada tarjeta muestra imagen, specs y precio, con
   una pequeña animación de entrada al cargar la página.
   ------------------------------------------------------ */

function renderModelsGrid() {
  const grid = document.getElementById("models-grid");
  if (!grid) return;

  grid.innerHTML = CARS.map((car, i) => `
    <article class="card" style="animation-delay: ${i * 0.12}s">
      <div class="card__img-wrap">
        <img src="${car.image}" alt="${car.name}" class="card__img">
      </div>
      <div class="card__body">
        <h2>${car.name}</h2>
        <p class="card__desc">${car.desc}</p>
        <div class="card__specs">
          <div><strong>${car.hp}</strong><span>CV</span></div>
          <div><strong>${car.accel}</strong><span>0-100</span></div>
          <div><strong>${car.top}</strong><span>Vel. máx.</span></div>
        </div>
        <p class="card__price">${formatPrice(car.price)}</p>
        <button class="btn btn--light btn--full add-to-cart" data-id="${car.id}">Añadir al carrito</button>
      </div>
    </article>
  `).join("");

  grid.querySelectorAll(".add-to-cart").forEach(btn =>
    btn.addEventListener("click", () => {
      addToCart(btn.dataset.id);
      showToast(`${getCarById(btn.dataset.id).name} añadido al carrito`);
    }));
}

/* ------------------------------------------------------
   4. CARRUSEL DE TARJETAS APILADAS
   Un auto al frente y el resto apilado detrás, con un
   panel de texto al lado y flechas arriba/abajo.
   Avanza solo cada 4 segundos y JAMÁS se detiene.
   ------------------------------------------------------ */

function initCarousel(contenedor) {
  let indiceActual = 0;
  const slides = GALLERY;

  contenedor.innerHTML = `
    <div class="stack-cards" id="stack-cards">
      ${slides.map(s => `<div class="stack-card"><img src="${s.image}" alt="BMW M"></div>`).join("")}
    </div>
    <div class="stack-caption">
      <div class="stack-nav">
        <button data-dir="-1" aria-label="Anterior">↑</button>
        <button data-dir="1" aria-label="Siguiente">↓</button>
      </div>
      <h3 id="stack-title"></h3>
      <p id="stack-sub">BMW M DIVISION</p>
      <div class="stack-line"></div>
    </div>
  `;

  const tituloEl = contenedor.querySelector("#stack-title");
  // Las tarjetas se crean UNA sola vez aquí arriba; actualizarVista solo
  // les cambia el transform, así el navegador sí anima el deslizamiento.
  const capas = contenedor.querySelectorAll(".stack-card");

  // Dibuja las tarjetas apiladas: la activa al frente, deslizándose
  // hacia arriba, y el resto detrás cada vez más pequeñas.
  function actualizarVista() {
    slides.forEach((s, i) => {
      // distancia circular hacia adelante desde la tarjeta activa
      const distancia = (i - indiceActual + slides.length) % slides.length;
      const capa = capas[i];

      if (distancia === 0) {
        capa.style.transform = "translateY(0) scale(1)";
        capa.style.opacity = "1";
        capa.style.zIndex = "3";
        capa.style.filter = "none";
      } else if (distancia === 1) {
        capa.style.transform = "translateY(-46px) scale(0.9)";
        capa.style.opacity = "0.5";
        capa.style.zIndex = "2";
        capa.style.filter = "blur(1px)";
      } else if (distancia === 2) {
        capa.style.transform = "translateY(-80px) scale(0.82)";
        capa.style.opacity = "0.25";
        capa.style.zIndex = "1";
        capa.style.filter = "blur(2px)";
      } else {
        // el resto espera abajo, fuera de vista, listo para subir en su turno
        capa.style.transform = "translateY(120px) scale(0.9)";
        capa.style.opacity = "0";
        capa.style.zIndex = "0";
      }
    });

    tituloEl.textContent = slides[indiceActual].caption;
  }

  function irA(direccion) {
    indiceActual = (indiceActual + direccion + slides.length) % slides.length;
    actualizarVista();
  }

  contenedor.querySelectorAll("[data-dir]").forEach(btn =>
    btn.addEventListener("click", () => irA(Number(btn.dataset.dir))));

  // Autoplay permanente: no tiene pausa al pasar el mouse.
  setInterval(() => irA(1), 4000);

  actualizarVista();
}

/* ------------------------------------------------------
   5. INICIO DE SESIÓN (simulado con localStorage)
   ------------------------------------------------------ */

let authMode = "login";

function getAuthUser() {
  return JSON.parse(localStorage.getItem(AUTH_KEY));
}

function updateAuthUI() {
  const link = document.getElementById("auth-link");
  if (!link) return;
  const user = getAuthUser();

  if (user) {
    link.textContent = `Hola, ${user.name.split(" ")[0]} · Salir`;
    link.onclick = (e) => {
      e.preventDefault();
      localStorage.removeItem(AUTH_KEY);
      updateAuthUI();
      showToast("Sesión cerrada");
    };
  } else {
    link.textContent = "Iniciar sesión";
    link.onclick = (e) => {
      e.preventDefault();
      openModal("login-modal");
    };
  }
}

function setAuthMode(mode) {
  authMode = mode;
  const titulo = document.getElementById("auth-title");
  const campoNombre = document.getElementById("auth-name-field");
  const textoCambio = document.getElementById("auth-switch-text");
  const enlaceCambio = document.getElementById("auth-switch-link");

  if (mode === "login") {
    titulo.textContent = "Iniciar sesión";
    campoNombre.style.display = "none";
    textoCambio.textContent = "¿No tienes cuenta?";
    enlaceCambio.textContent = "Regístrate";
  } else {
    titulo.textContent = "Crear cuenta";
    campoNombre.style.display = "block";
    textoCambio.textContent = "¿Ya tienes cuenta?";
    enlaceCambio.textContent = "Inicia sesión";
  }
}

function initAuthForm() {
  const formulario = document.getElementById("auth-form");
  const enlaceCambio = document.getElementById("auth-switch-link");
  if (!formulario) return;

  enlaceCambio.addEventListener("click", (e) => {
    e.preventDefault();
    setAuthMode(authMode === "login" ? "register" : "login");
  });

  formulario.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-email").value;
    const nombreInput = document.getElementById("auth-name").value;
    const nombre = (authMode === "register" && nombreInput) ? nombreInput : email.split("@")[0];

    localStorage.setItem(AUTH_KEY, JSON.stringify({ name: nombre, email: email }));

    updateAuthUI();
    closeModal("login-modal");
    showToast(`Bienvenido, ${nombre}`);
    formulario.reset();
    setAuthMode("login");
  });
}

function openModal(id) {
  document.getElementById(id).classList.add("active");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}

document.addEventListener("click", e => {
  if (e.target.matches("[data-close-modal]") || e.target.classList.contains("modal-overlay")) {
    e.target.closest(".modal-overlay")?.classList.remove("active");
  }
});

/* ------------------------------------------------------
   5. Aviso flotante (toast)
   ------------------------------------------------------ */

function showToast(mensaje) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = mensaje;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

/* ------------------------------------------------------
   6. Arranque
   ------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  renderCart();
  renderModelsGrid();
  initAuthForm();
  updateAuthUI();
  document.querySelectorAll(".stack-carousel").forEach(initCarousel);

  // Respaldo: si el navegador no repite el video del hero solo
  // (a veces pasa al abrir el sitio como archivo local), lo reiniciamos.
  const heroVideo = document.querySelector(".hero__video");
  if (heroVideo) {
    heroVideo.addEventListener("ended", () => {
      heroVideo.currentTime = 0;
      heroVideo.play();
    });
  }
});
