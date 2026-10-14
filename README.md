# Emaús Cristo Rey Cali — Sitio web y backoffice

Sitio web público y panel de administración de la comunidad **Emaús Cristo Rey Cali**, construido con
Next.js 16 (App Router + Cache Components), React 19, Tailwind CSS 4, Drizzle ORM y PostgreSQL (Neon).

## Funcionalidades

**Sitio público (`/`)**

- Banner rotativo responsivo (1–3 diapositivas, imagen de escritorio y móvil opcional). Se puede desactivar; en ese caso se muestra el logo.
- Calendario mensual de eventos (mes en curso, navegable hacia el futuro) con modal de detalle (imagen, fecha, descripción y ubicación).
- Página indexable por evento: `/eventos/[slug]` con datos estructurados `schema.org/Event`.
- Galería de Instagram (5 imágenes administradas) con enlace a la cuenta oficial.
- Sección **Herramientas** (Pan de la Palabra, Biblia Católica, Santo Rosario…), editable.
- Sección de contacto (dirección, teléfono, correo, coordinador del grupo y coordinador espiritual).
- Botón flotante de WhatsApp con número configurable.
- SEO: metadata y Open Graph, `sitemap.xml`, `robots.txt`, manifest, JSON-LD de organización y eventos.

**Llamado a lista con QR (`/asistencia/[token]`)**

- Cada evento tiene un código QR único (descargable en PNG o compartible) que abre el formulario de asistencia.
- Se solicita cédula, nombre completo, teléfono y fecha de nacimiento, más la autorización de tratamiento de datos.
- Si la persona ya se registró en un evento anterior, sus datos se cargan al digitar la cédula. La consulta tiene límite de intentos.
- Solo se permite un registro por persona y por evento (restricción única en la base de datos).
- Desde el panel se puede regenerar el código, lo que invalida el QR anterior.

**Backoffice (`/admin`)**

- Eventos: crear, editar, publicar, eliminar, código QR, lista de asistentes y exportación a Excel o CSV.
- Personas: búsqueda e historial de asistencia por persona.
- Banner, galería de Instagram, herramientas, configuración general (WhatsApp, contacto y redes) y usuarios administradores.

## Requisitos

- Node.js 20.9 o superior.
- Una base de datos PostgreSQL. En producción se usa Neon; en local, PGlite (incluido).

## Desarrollo local

```bash
npm install
cp .env.example .env.local         # completar las variables (ver abajo)
npm run db:local                   # en otra terminal: PostgreSQL embebido (PGlite) en el puerto 5433
npm run db:migrate                 # crea las tablas
npm run db:seed                    # datos iniciales + primer administrador
npm run dev                        # http://localhost:3000
```

Ejemplo de `.env.local` para desarrollo:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5433/postgres
AUTH_SECRET=<openssl rand -base64 48>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SEED_ADMIN_EMAIL=admin@emauscristorey.local
SEED_ADMIN_PASSWORD=<mínimo 10 caracteres>
SEED_ADMIN_NAME=Administrador
```

Sin `BLOB_READ_WRITE_TOKEN`, las imágenes subidas se guardan en `.uploads/` y se sirven en `/media/...`.
Esto es solo para desarrollo.

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión de PostgreSQL. En Neon, usar la conexión *pooled*. |
| `AUTH_SECRET` | Secreto para firmar las sesiones del panel (mínimo 32 caracteres). |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio sin `/` final. Se usa en canonical, sitemap y los enlaces de los QR. |
| `BLOB_READ_WRITE_TOKEN` | Token de Vercel Blob para guardar imágenes. Obligatorio en producción. |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` | Primer administrador; solo los usa `npm run db:seed`. |

## Despliegue (Vercel + Neon + Vercel Blob)

1. Importar el repositorio en Vercel.
2. En *Storage*, conectar una base de datos **Neon** (crea `DATABASE_URL`) y un **Blob Store** (crea `BLOB_READ_WRITE_TOKEN`).
3. Definir `AUTH_SECRET` y `NEXT_PUBLIC_SITE_URL` con el dominio definitivo.
4. Ejecutar las migraciones y el seed contra la base de producción, una sola vez y desde local:
   ```bash
   DATABASE_URL="<url de neon>" SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run db:migrate
   DATABASE_URL="<url de neon>" SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run db:seed
   ```
   Para crear o restablecer un administrador en producción, usar el asistente interactivo. Pide la `DATABASE_URL` y la contraseña sin mostrarlas en pantalla:
   ```bash
   npm run admin:create
   ```
5. Desplegar. Ingresar a `/admin` con el administrador creado y cambiar la contraseña desde **Usuarios**.

> Si se cambia el dominio, actualizar `NEXT_PUBLIC_SITE_URL` y volver a descargar los QR, porque contienen la URL completa.

## Scripts

| Script | Uso |
| --- | --- |
| `npm run dev` / `build` / `start` | Desarrollo, compilación y servidor de producción. |
| `npm run lint` / `typecheck` | ESLint y TypeScript. |
| `npm run db:local` | PostgreSQL local con PGlite (puerto 5433, datos en `.pglite/`). |
| `npm run db:generate` | Genera migraciones tras cambiar `src/db/schema.ts`. |
| `npm run db:migrate` / `db:seed` | Aplica las migraciones y carga los datos iniciales. |
| `npm run admin:create` | Crea un administrador o restablece su contraseña (interactivo). |
| `npm run db:studio` | Explorador de la base de datos (Drizzle Studio). |

## Estructura

```
src/
  app/(site)/        Sitio público (inicio, eventos, privacidad)
  app/asistencia/    Formulario de llamado a lista (QR)
  app/admin/         Backoffice (login y panel)
  components/        Componentes del sitio, del admin y de SEO
  db/                Esquema de Drizzle y conexión
  lib/actions/       Server Actions (mutaciones)
  lib/data/          Consultas (públicas cacheadas con 'use cache' y del admin)
  lib/auth/          Sesión (JWT firmado en cookie httpOnly) y control de acceso
  proxy.ts           Protección de rutas /admin
```

## Rendimiento y caché

El contenido público se cachea con `'use cache'` y etiquetas (`cacheTag`). Cada cambio en el backoffice
invalida solo las etiquetas afectadas, así que el sitio se actualiza al instante sin recompilar.
Las imágenes se sirven optimizadas con `next/image` (AVIF/WebP). La primera diapositiva del banner se precarga como imagen LCP.
