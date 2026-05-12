const products = [
  {
    id: "guardian-del-bosque",
    name: "Guardián del Bosque",
    collection: "bosque",
    price: 28500,
    image: "assets/product-guardian-del-bosque.png",
    description: "Figura protectora con geometrías vegetales, mirada serena y acabado profundo en madera natural.",
    materials: "Madera tallada, pigmentos minerales, cera natural",
    dimensions: "28 x 18 x 32 cm",
    time: "46 horas",
    story: "Nació como una presencia silenciosa para custodiar bibliotecas, vestíbulos y espacios de contemplación. Sus trazos siguen la idea de un bosque interior: raíces, caminos y señales que solo aparecen cuando la luz toca la superficie."
  },
  {
    id: "criatura-nocturna",
    name: "Criatura Nocturna",
    collection: "noche",
    price: 19800,
    image: "assets/product-criatura-nocturna.png",
    description: "Pieza de luz baja, creada para revelar tonos oscuros, oro suave y detalles de pincel.",
    materials: "Madera de copal, acrílico artesanal, sellado mate",
    dimensions: "22 x 16 x 28 cm",
    time: "38 horas",
    story: "La figura mira como si reconociera los secretos de una casa al anochecer. Fue pintada con capas muy delgadas para que el negro, el índigo y la terracota respiren sobre la veta."
  },
  {
    id: "espiritu-del-sol",
    name: "Espíritu del Sol",
    collection: "sol",
    price: 26000,
    image: "assets/product-espiritu-del-sol.png",
    description: "Escultura radiante con líneas solares, presencia ceremonial y detalles dorados.",
    materials: "Madera tallada, pigmento terracota, hoja metálica suave",
    dimensions: "30 x 10 x 30 cm",
    time: "52 horas",
    story: "Esta pieza fue creada como un punto de calor visual. Sus formas se abren hacia afuera para evocar amaneceres, patios de barro y el instante en que una sombra empieza a retroceder."
  },
  {
    id: "canto-de-copal",
    name: "Canto de Copal",
    collection: "bosque",
    price: 14600,
    image: "assets/product-canto-de-copal.png",
    description: "Figura compacta de colección con curvas suaves y pintura fina en tonos tierra.",
    materials: "Madera ligera, pintura a mano, barniz satinado",
    dimensions: "18 x 12 x 24 cm",
    time: "31 horas",
    story: "Su forma recuerda un canto suspendido: pequeña, precisa y llena de movimiento. Está pensada para convivir con libros, cerámica, textiles y objetos personales."
  },
  {
    id: "umbral-de-lluvia",
    name: "Umbral de Lluvia",
    collection: "noche",
    price: 22400,
    image: "assets/product-umbral-de-lluvia.png",
    description: "Escultura de curvas fluidas, verdes profundos y acentos dorados sobre madera vista.",
    materials: "Madera tallada, pigmento verde profundo, cera mineral",
    dimensions: "24 x 14 x 27 cm",
    time: "44 horas",
    story: "Fue imaginada como la pieza que aparece justo antes de la tormenta. Sus líneas cruzadas hablan de agua, tierra húmeda y una calma antigua."
  }
];

const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0
});

const cartKey = "tallador-cart";

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initReveal();
  initParallax();
  updateCartCount();
  markActiveNav();
  renderFeaturedProducts();
  renderShop();
  renderProductDetail();
  renderCart();
  initCheckout();
  initContactForm();
});

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(cartKey)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(cartKey, JSON.stringify(cart));
  updateCartCount();
}

function addToCart(id, quantity = 1) {
  const product = products.find((item) => item.id === id);
  if (!product) return;
  const cart = getCart();
  const existing = cart.find((item) => item.id === id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ id, quantity });
  }
  saveCart(cart);
  showToast(`${product.name} se agregó al carrito.`);
}

function removeFromCart(id) {
  saveCart(getCart().filter((item) => item.id !== id));
  renderCart();
}

function changeQuantity(id, delta) {
  const cart = getCart().map((item) => {
    if (item.id === id) {
      return { ...item, quantity: Math.max(1, item.quantity + delta) };
    }
    return item;
  });
  saveCart(cart);
  renderCart();
}

function cartDetails() {
  return getCart()
    .map((item) => {
      const product = products.find((entry) => entry.id === item.id);
      return product ? { ...product, quantity: item.quantity } : null;
    })
    .filter(Boolean);
}

function cartSubtotal() {
  return cartDetails().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function updateCartCount() {
  const count = getCart().reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = count;
  });
}

function productCard(product) {
  const article = document.createElement("article");
  article.className = "product-card reveal";
  article.innerHTML = `
    <a class="media" href="product.html?id=${product.id}" aria-label="Ver ${product.name}">
      <img src="${product.image}" alt="${product.name}">
    </a>
    <div class="body">
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <div class="price-row">
        <span>${money.format(product.price)}</span>
        <span>${product.dimensions}</span>
      </div>
      <div class="card-actions">
        <a class="mini-button" href="product.html?id=${product.id}">Ver pieza</a>
        <button class="icon-button" type="button" aria-label="Agregar ${product.name} al carrito" data-add="${product.id}">
          ${bagIcon()}
        </button>
      </div>
    </div>
  `;
  return article;
}

function renderFeaturedProducts() {
  const container = document.querySelector("[data-featured-products]");
  if (!container) return;
  products.slice(0, 4).forEach((product) => container.appendChild(productCard(product)));
  bindAddButtons(container);
  initReveal();
}

function renderShop() {
  const container = document.querySelector("[data-shop-products]");
  if (!container) return;
  const params = new URLSearchParams(window.location.search);
  const initialCollection = params.get("collection") || "all";
  const filterButtons = document.querySelectorAll("[data-filter]");

  const paint = (collection) => {
    container.innerHTML = "";
    const filtered = collection === "all" ? products : products.filter((item) => item.collection === collection);
    filtered.forEach((product) => container.appendChild(productCard(product)));
    filterButtons.forEach((button) => button.classList.toggle("active", button.dataset.filter === collection));
    bindAddButtons(container);
    initReveal();
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => paint(button.dataset.filter));
  });

  paint(initialCollection);
}

function renderProductDetail() {
  const root = document.querySelector("[data-product-detail]");
  if (!root) return;
  const id = new URLSearchParams(window.location.search).get("id") || products[0].id;
  const product = products.find((item) => item.id === id) || products[0];
  const alternates = products.filter((item) => item.id !== product.id).slice(0, 2);
  const gallery = [product, ...alternates];

  document.title = `${product.name} | Tallador de Sueños`;
  root.innerHTML = `
    <div class="product-gallery reveal">
      <img class="product-main-image" src="${product.image}" alt="${product.name}" data-main-product-image>
      <div class="thumb-row">
        ${gallery.map((item, index) => `
          <button class="${index === 0 ? "active" : ""}" type="button" data-thumb="${item.image}" aria-label="Ver imagen ${index + 1}">
            <img src="${item.image}" alt="${item.name}">
          </button>
        `).join("")}
      </div>
    </div>
    <section class="product-info reveal">
      <p class="section-kicker">Pieza única</p>
      <h1>${product.name}</h1>
      <div class="price">${money.format(product.price)}</div>
      <p>${product.description}</p>
      <div class="spec-list">
        <div><span>Materiales</span>${product.materials}</div>
        <div><span>Dimensiones</span>${product.dimensions}</div>
        <div><span>Elaboración</span>${product.time}</div>
        <div><span>Origen</span>Estudio mexicano contemporáneo</div>
      </div>
      <div class="purchase-actions">
        <button class="button primary" type="button" data-add="${product.id}">Agregar al carrito</button>
        <button class="button ghost" type="button" data-buy="${product.id}">Comprar ahora</button>
      </div>
      <div class="story-panel">
        <p class="section-kicker">Historia de la pieza</p>
        <p>${product.story}</p>
      </div>
    </section>
  `;

  root.querySelectorAll("[data-thumb]").forEach((button) => {
    button.addEventListener("click", () => {
      root.querySelector("[data-main-product-image]").src = button.dataset.thumb;
      root.querySelectorAll("[data-thumb]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });

  bindAddButtons(root);
  const buyButton = root.querySelector("[data-buy]");
  buyButton.addEventListener("click", () => {
    addToCart(product.id);
    window.location.href = "checkout.html";
  });
  initReveal();
}

function renderCart() {
  const list = document.querySelector("[data-cart-list]");
  const summary = document.querySelector("[data-cart-summary]");
  if (!list || !summary) return;

  const items = cartDetails();
  if (!items.length) {
    list.innerHTML = `
      <div class="cart-empty">
        <h2>Tu carrito está listo para recibir una pieza.</h2>
        <p>Explora la colección y elige una escultura para iniciar tu pedido.</p>
        <a class="button primary" href="shop.html">Explorar colección</a>
      </div>
    `;
  } else {
    list.innerHTML = items.map((item) => `
      <article class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div>
          <h3>${item.name}</h3>
          <p>${money.format(item.price)} · ${item.dimensions}</p>
          <div class="quantity-control" aria-label="Cantidad de ${item.name}">
            <button type="button" data-qty="${item.id}" data-delta="-1">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-qty="${item.id}" data-delta="1">+</button>
          </div>
        </div>
        <div class="cart-actions">
          <strong>${money.format(item.price * item.quantity)}</strong>
          <button class="mini-button" type="button" data-remove="${item.id}">Eliminar</button>
        </div>
      </article>
    `).join("");
  }

  const subtotal = cartSubtotal();
  const shipping = items.length ? 950 : 0;
  const total = subtotal + shipping;
  summary.innerHTML = `
    <h2>Resumen</h2>
    <div class="summary-line"><span>Subtotal</span><strong>${money.format(subtotal)}</strong></div>
    <div class="summary-line"><span>Envío curado</span><strong>${shipping ? money.format(shipping) : "$0"}</strong></div>
    <div class="summary-line total"><span>Total</span><strong>${money.format(total)}</strong></div>
    <a class="button primary full" href="checkout.html">Continuar a pago</a>
  `;

  list.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => removeFromCart(button.dataset.remove));
  });
  list.querySelectorAll("[data-qty]").forEach((button) => {
    button.addEventListener("click", () => changeQuantity(button.dataset.qty, Number(button.dataset.delta)));
  });
}

function initCheckout() {
  const summary = document.querySelector("[data-checkout-summary]");
  const form = document.querySelector("[data-checkout-form]");
  if (!summary || !form) return;
  renderCheckoutSummary(summary);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = form.querySelector("[data-form-status]");
    const items = cartDetails();
    if (!items.length) {
      status.textContent = "Agrega una pieza al carrito antes de finalizar.";
      return;
    }
    const payload = {
      customer: Object.fromEntries(new FormData(form).entries()),
      items: items.map(({ id, quantity, price }) => ({ id, quantity, price })),
      total: cartSubtotal() + 950
    };

    status.textContent = "Preparando pedido seguro...";
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("No se pudo registrar el pedido.");
      localStorage.removeItem(cartKey);
      updateCartCount();
      renderCheckoutSummary(summary);
      status.textContent = "Pedido recibido. Te contactaremos con la confirmación de disponibilidad y pago seguro.";
    } catch {
      status.textContent = "Pedido preparado localmente. Conecta el servidor y PostgreSQL para registrar pagos reales.";
    }
  });
}

function renderCheckoutSummary(summary) {
  const items = cartDetails();
  const subtotal = cartSubtotal();
  const shipping = items.length ? 950 : 0;
  summary.innerHTML = `
    <h2>Pedido</h2>
    ${items.length ? items.map((item) => `
      <div class="summary-line"><span>${item.name} × ${item.quantity}</span><strong>${money.format(item.price * item.quantity)}</strong></div>
    `).join("") : `<p>Aún no hay piezas en el carrito.</p>`}
    <div class="summary-line"><span>Envío</span><strong>${shipping ? money.format(shipping) : "$0"}</strong></div>
    <div class="summary-line total"><span>Total</span><strong>${money.format(subtotal + shipping)}</strong></div>
  `;
}

function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
      form.querySelector("[data-form-status]").textContent = "Mensaje recibido. El estudio responderá con disponibilidad y tiempos de entrega.";
    form.reset();
  });
}

function bindAddButtons(scope = document) {
  scope.querySelectorAll("[data-add]").forEach((button) => {
    button.addEventListener("click", () => addToCart(button.dataset.add));
  });
}

function initNavigation() {
  const header = document.querySelector("[data-header]");
  const nav = document.querySelector("[data-nav]");
  const toggle = document.querySelector("[data-nav-toggle]");
  if (!header) return;

  const paint = () => header.classList.toggle("scrolled", window.scrollY > 24);
  paint();
  window.addEventListener("scroll", paint, { passive: true });

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      header.classList.toggle("menu-active", open);
      document.body.classList.toggle("menu-open", open);
    });
  }
}

function markActiveNav() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".site-nav a").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === path);
  });
}

function initReveal() {
  const nodes = document.querySelectorAll(".reveal:not(.visible)");
  if (!("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  nodes.forEach((node) => observer.observe(node));
}

function initParallax() {
  const image = document.querySelector("[data-parallax]");
  if (!image || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const move = () => {
    image.style.setProperty("--parallax", `${window.scrollY * 0.08}px`);
  };
  move();
  window.addEventListener("scroll", move, { passive: true });
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function bagIcon() {
  return `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 8h10l1 12H6L7 8Z" stroke="currentColor" stroke-width="1.6"/>
    <path d="M9 8a3 3 0 0 1 6 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
  </svg>`;
}
