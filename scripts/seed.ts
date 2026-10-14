import { config } from "dotenv";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import bcrypt from "bcryptjs";
import * as schema from "../src/db/schema";

config({ path: ".env.local" });
config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  await db
    .insert(schema.siteSettings)
    .values({
      id: 1,
      bannerEnabled: true,
      instagramUrl: "https://www.instagram.com/emauscristoreyhombresoficial/",
      whatsappMessage: "Hola, quiero información sobre Emaús Cristo Rey Cali",
      address: "Parroquia Cristo Rey, Cali, Valle del Cauca",
      seoTitle: "Emaús Cristo Rey Cali",
      seoDescription:
        "Comunidad Emaús Hombres de la Parroquia Cristo Rey en Cali. Retiros, eventos, oración y herramientas para crecer en la fe.",
    })
    .onConflictDoNothing();

  const existingTools = await db.select({ id: schema.tools.id }).from(schema.tools).limit(1);
  if (existingTools.length === 0) {
    await db.insert(schema.tools).values([
      {
        name: "Pan de la Palabra",
        description: "Lecturas y reflexión del Evangelio de cada día.",
        url: "https://panvivo.emauscristorey.com/",
        sortOrder: 1,
      },
      {
        name: "Biblia Católica",
        description: "Lee y busca en la Sagrada Escritura desde cualquier dispositivo.",
        url: "https://biblia.emauscristorey.com/",
        sortOrder: 2,
      },
      {
        name: "Santo Rosario",
        description: "Reza el Santo Rosario guiado con los misterios del día.",
        url: "https://rosario.emauscristorey.com/",
        sortOrder: 3,
      },
    ]);
  }

  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    if (password.length < 10) throw new Error("SEED_ADMIN_PASSWORD debe tener al menos 10 caracteres");
    await db
      .insert(schema.adminUsers)
      .values({
        email,
        name: process.env.SEED_ADMIN_NAME || "Administrador",
        passwordHash: await bcrypt.hash(password, 12),
      })
      .onConflictDoNothing();
    console.log(`Administrador: ${email}`);
  } else {
    console.log("SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD no definidos: no se creó administrador");
  }

  await pool.end();
  console.log("Semilla aplicada");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
