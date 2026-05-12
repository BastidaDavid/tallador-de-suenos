const path = require("path");
const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3000;
const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;

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
    craft_time: "46 horas",
    story: "Nació como una presencia silenciosa para custodiar bibliotecas, vestíbulos y espacios de contemplación."
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
    craft_time: "38 horas",
    story: "La figura mira como si reconociera los secretos de una casa al anochecer."
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
    craft_time: "52 horas",
    story: "Esta pieza fue creada como un punto de calor visual para interiores con carácter."
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
    craft_time: "31 horas",
    story: "Su forma recuerda un canto suspendido: pequeña, precisa y llena de movimiento."
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
    craft_time: "44 horas",
    story: "Fue imaginada como la pieza que aparece justo antes de la tormenta."
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
