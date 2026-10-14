import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

// Crea o actualiza un administrador pidiendo los datos de forma interactiva.
// La conexión y la contraseña no se muestran en pantalla ni quedan en el historial.

let muted = false;
const output = new Writable({
  write(chunk, encoding, callback) {
    if (!muted) process.stdout.write(chunk, encoding);
    callback();
  },
});
const rl = createInterface({ input: process.stdin, output, terminal: Boolean(process.stdin.isTTY) });
const lines = rl[Symbol.asyncIterator]();

async function ask(label: string, hidden = false) {
  process.stdout.write(label);
  muted = hidden;
  const { value, done } = await lines.next();
  muted = false;
  if (hidden && process.stdin.isTTY) process.stdout.write("\n");
  if (done) throw new Error("Entrada cancelada");
  return String(value).trim();
}

function describeTarget(url: string) {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.port ? `:${u.port}` : ""}${u.pathname}`;
  } catch {
    return null;
  }
}

async function main() {
  const databaseUrl = await ask("DATABASE_URL de la base (oculto): ", true);
  const target = databaseUrl && describeTarget(databaseUrl);
  if (!target || !/^postgres(ql)?:/.test(databaseUrl)) {
    throw new Error("La cadena de conexión no es válida. Debe empezar por postgresql://");
  }
  console.log(`Base de datos: ${target}`);

  const email = (await ask("Correo del administrador: ")).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Correo no válido");

  const name = (await ask("Nombre: ")) || "Administrador";

  const password = await ask("Contraseña (mínimo 10 caracteres, oculta): ", true);
  if (password.length < 10) throw new Error("La contraseña debe tener al menos 10 caracteres");
  const confirm = await ask("Confirmar contraseña: ", true);
  if (password !== confirm) throw new Error("Las contraseñas no coinciden");

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query<{ created: boolean }>(
      `insert into admin_users (name, email, password_hash)
       values ($1, $2, $3)
       on conflict (email) do update
         set name = excluded.name, password_hash = excluded.password_hash, updated_at = now()
       returning (xmax = 0) as created`,
      [name, email, hash],
    );
    console.log(rows[0]?.created ? `Administrador creado: ${email}` : `Administrador actualizado: ${email}`);
  } finally {
    await pool.end();
  }
}

main()
  .catch((e) => {
    console.error(`\nError: ${e instanceof Error ? e.message : e}`);
    process.exitCode = 1;
  })
  .finally(() => rl.close());
