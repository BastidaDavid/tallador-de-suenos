const path = require("path");
const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3000;
const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;

const products = [
  {
    id: "guardian-del-maguey",
    name: "Guardián del Maguey",
    collection: "bosque",
    price: 18900,
    image: "assets/catalogo/guardian-del-maguey.jpg",
    description: "Escultura vegetal con figura protectora, hojas talladas y acentos intensos en verde, rosa y oro.",
    materials: "Madera tallada, pigmentos acrílicos, fibras naturales y sellado mate",
    dimensions: "34 x 22 x 30 cm",
    craft_time: "48 horas",
    story: "Esta pieza surge como un pequeño santuario de mesa: un maguey imaginario que abre sus hojas para resguardar una presencia silenciosa."
  },
  {
    id: "vigia-nocturno",
    name: "Vigía Nocturno",
    collection: "noche",
    price: 22800,
    image: "assets/catalogo/vigia-nocturno.jpg",
    description: "Figura oscura de postura baja, mirada alerta y patrones finos que brillan con luz rasante.",
    materials: "Madera de copal, pigmento negro profundo, acrílico fino y cera natural",
    dimensions: "42 x 13 x 24 cm",
    craft_time: "44 horas",
    story: "Fue concebida como una presencia de umbral: discreta a primera vista, pero llena de signos cuando el ojo se acerca."
  },
  {
    id: "mensajero-del-sol",
    name: "Mensajero del Sol",
    collection: "sol",
    price: 26500,
    image: "assets/catalogo/mensajero-del-sol.jpg",
    description: "Criatura luminosa de orejas altas, cuerpo amarillo y patrones azules con presencia ceremonial.",
    materials: "Madera tallada, pigmentos minerales, acrílico artístico y barniz satinado",
    dimensions: "48 x 12 x 36 cm",
    craft_time: "56 horas",
    story: "El gesto frontal de la pieza recuerda a un emisario que llega con una señal de luz."
  },
  {
    id: "caracol-de-copal",
    name: "Caracol de Copal",
    collection: "bosque",
    price: 21600,
    image: "assets/catalogo/caracol-de-copal.jpg",
    description: "Pieza de espiral morada, cuerpo texturizado y detalles naranjas que evocan un objeto ritual.",
    materials: "Madera ligera, pigmentos violeta y terracota, pincel fino y sellado satinado",
    dimensions: "32 x 15 x 21 cm",
    craft_time: "41 horas",
    story: "La espiral fue pintada como una memoria en movimiento para vitrinas, libreros o espacios de contemplación."
  },
  {
    id: "elefante-de-agua",
    name: "Elefante de Agua",
    collection: "noche",
    price: 29400,
    image: "assets/catalogo/elefante-de-agua.jpg",
    description: "Figura de gran presencia con azules profundos, orejas violetas y geometrías minuciosas.",
    materials: "Madera tallada, pigmentos azul petróleo y violeta, acabado semimate",
    dimensions: "40 x 16 x 27 cm",
    craft_time: "62 horas",
    story: "El cuerpo fue tratado como un mapa de agua nocturna: círculos, líneas y pequeños puntos que acompañan el volumen."
  },
  {
    id: "venado-celeste",
    name: "Venado Celeste",
    collection: "sol",
    price: 24800,
    image: "assets/catalogo/venado-celeste.jpg",
    description: "Escultura vertical de cornamenta azul, orejas rosadas y patrones finos en tonos arena.",
    materials: "Madera tallada, pigmento azul cobalto, pintura a mano y cera protectora",
    dimensions: "22 x 14 x 38 cm",
    craft_time: "49 horas",
    story: "Su silueta mira hacia arriba, como si escuchara algo fuera de escena."
  },
  {
    id: "guardian-del-cerro",
    name: "Guardián del Cerro",
    collection: "sol",
    price: 31000,
    image: "assets/catalogo/guardian-del-cerro.jpg",
    description: "Figura de cuernos amplios, cuerpo café y acentos turquesa con mirada de pieza ceremonial.",
    materials: "Madera tallada, pigmentos tierra, turquesa y oro suave, barniz mate",
    dimensions: "36 x 18 x 31 cm",
    craft_time: "58 horas",
    story: "Esta obra se construye alrededor de sus cuernos: dos curvas que parecen recoger aire, sol y memoria."
  },
  {
    id: "iguana-turquesa",
    name: "Iguana Turquesa",
    collection: "bosque",
    price: 17400,
    image: "assets/catalogo/iguana-turquesa.jpg",
    description: "Pieza horizontal de líneas extendidas, color turquesa y patrones circulares sobre el lomo.",
    materials: "Madera de copal, pigmento turquesa, acrílico de color y sellado satinado",
    dimensions: "46 x 10 x 13 cm",
    craft_time: "36 horas",
    story: "Baja, serena y alargada, esta pieza funciona como una línea de color para repisas, consolas o mesas."
  }
];

app.use(express.json());
app.use(express.static(__dirname));

app.get("/api/health", async (_request, response) => {
  response.json({
    ok: true,
    database: Boolean(pool),
    payments: ["stripe", "apple_pay", "paypal", "google_pay"]
  });
});

app.get("/api/products", async (_request, response, next) => {
  try {
    if (!pool) {
      response.json(products);
      return;
    }
    const result = await pool.query("select * from products order by created_at asc");
    response.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/products/:id", async (request, response, next) => {
  try {
    if (!pool) {
      const product = products.find((item) => item.id === request.params.id);
      response.status(product ? 200 : 404).json(product || { error: "Producto no encontrado" });
      return;
    }
    const result = await pool.query("select * from products where id = $1", [request.params.id]);
    response.status(result.rows[0] ? 200 : 404).json(result.rows[0] || { error: "Producto no encontrado" });
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders", async (request, response, next) => {
  try {
    const { customer, items, total } = request.body;
    if (!customer || !Array.isArray(items) || !items.length) {
      response.status(400).json({ error: "Pedido incompleto" });
      return;
    }

    if (!pool) {
      response.status(201).json({
        id: `local-${Date.now()}`,
        status: "prepared",
        total
      });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query("begin");
      const orderResult = await client.query(
        `insert into orders (customer_name, customer_email, country, address, payment_method, total)
         values ($1, $2, $3, $4, $5, $6)
         returning id, status, total`,
        [customer.name, customer.email, customer.country, customer.address, customer.payment, total]
      );

      for (const item of items) {
        await client.query(
          `insert into order_items (order_id, product_id, quantity, unit_price)
           values ($1, $2, $3, $4)`,
          [orderResult.rows[0].id, item.id, item.quantity, item.price]
        );
      }

      await client.query("commit");
      response.status(201).json(orderResult.rows[0]);
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: "Error interno del servidor" });
});

async function initDatabase() {
  if (!pool) return;
  await pool.query(`
    create table if not exists products (
      id text primary key,
      name text not null,
      collection text not null,
      price integer not null,
      image text not null,
      description text not null,
      materials text not null,
      dimensions text not null,
      craft_time text not null,
      story text not null,
      created_at timestamptz not null default now()
    );

    create table if not exists orders (
      id bigserial primary key,
      customer_name text not null,
      customer_email text not null,
      country text not null,
      address text not null,
      payment_method text not null,
      total integer not null,
      status text not null default 'prepared',
      created_at timestamptz not null default now()
    );

    create table if not exists order_items (
      id bigserial primary key,
      order_id bigint not null references orders(id) on delete cascade,
      product_id text not null references products(id),
      quantity integer not null check (quantity > 0),
      unit_price integer not null
    );
  `);

  for (const product of products) {
    await pool.query(
      `insert into products (id, name, collection, price, image, description, materials, dimensions, craft_time, story)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       on conflict (id) do update set
       name = excluded.name,
       collection = excluded.collection,
       price = excluded.price,
       image = excluded.image,
       description = excluded.description,
       materials = excluded.materials,
       dimensions = excluded.dimensions,
       craft_time = excluded.craft_time,
       story = excluded.story`,
      [
        product.id,
        product.name,
        product.collection,
        product.price,
        product.image,
        product.description,
        product.materials,
        product.dimensions,
        product.craft_time,
        product.story
      ]
    );
  }
}

initDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Tallador de Sueños disponible en http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("No se pudo iniciar la base de datos", error);
    process.exit(1);
  });
