"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/dal";
import { createSession, destroySession } from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { fromZod, str } from "./helpers";
import type { ActionState } from "./types";

const loginSchema = z.object({
  email: z.email("Correo no válido").max(254),
  password: z.string().min(1, "Ingresa la contraseña").max(200),
});

// Hash ficticio para igualar tiempos cuando el usuario no existe.
const DUMMY_HASH = "$2b$12$N5tyrGhcEWx51ho.XqByqegbTE41yzqe6l.MjWzHJzb8QBWIJk82u";

export async function login(_: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({ email: str(fd, "email").toLowerCase(), password: fd.get("password") });
  if (!parsed.success) return fromZod(parsed.error);
  const ip = await clientIp();
  if (!(await rateLimit(`login:${ip}`, 10, 15 * 60))) {
    return { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." };
  }
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, parsed.data.email)).limit(1);
  const ok = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return { error: "Correo o contraseña incorrectos." };
  await createSession(user.id);
  const next = str(fd, "next");
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

const userSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(120),
  email: z.email("Correo no válido").max(254),
  password: z.string().min(10, "Mínimo 10 caracteres").max(200),
});

export async function createAdminUser(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = userSchema.safeParse({ name: str(fd, "name"), email: str(fd, "email").toLowerCase(), password: fd.get("password") });
  if (!parsed.success) return fromZod(parsed.error);
  const hash = await bcrypt.hash(parsed.data.password, 12);
  const inserted = await db
    .insert(adminUsers)
    .values({ name: parsed.data.name, email: parsed.data.email, passwordHash: hash })
    .onConflictDoNothing()
    .returning({ id: adminUsers.id });
  if (inserted.length === 0) return { error: "Ya existe un usuario con ese correo." };
  refresh();
  return { ok: true, message: "Usuario creado." };
}

export async function deleteAdminUser(fd: FormData) {
  const me = await requireAdmin();
  const id = Number(fd.get("id"));
  if (!id || id === me.id) return;
  const all = await db.select({ id: adminUsers.id }).from(adminUsers);
  if (all.length <= 1) return;
  await db.delete(adminUsers).where(eq(adminUsers.id, id));
  redirect("/admin/usuarios");
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Ingresa tu contraseña actual"),
    password: z.string().min(10, "Mínimo 10 caracteres").max(200),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "Las contraseñas no coinciden", path: ["confirm"] });

export async function changePassword(_: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const parsed = passwordSchema.safeParse({ current: fd.get("current"), password: fd.get("password"), confirm: fd.get("confirm") });
  if (!parsed.success) return fromZod(parsed.error);
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, me.id)).limit(1);
  if (!user || !(await bcrypt.compare(parsed.data.current, user.passwordHash))) {
    return { error: "La contraseña actual no es correcta.", fieldErrors: { current: ["Contraseña incorrecta"] } };
  }
  await db.update(adminUsers).set({ passwordHash: await bcrypt.hash(parsed.data.password, 12) }).where(eq(adminUsers.id, me.id));
  return { ok: true, message: "Contraseña actualizada." };
}
