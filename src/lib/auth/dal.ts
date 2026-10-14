import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { readSession } from "./session";

export type AdminUser = { id: number; name: string; email: string };

export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  const session = await readSession();
  if (!session) return null;
  const [user] = await db
    .select({ id: adminUsers.id, name: adminUsers.name, email: adminUsers.email })
    .from(adminUsers)
    .where(eq(adminUsers.id, session.userId))
    .limit(1);
  return user ?? null;
});

export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdmin();
  if (!user) redirect("/admin/login");
  return user;
}
