import type { APIContext } from "astro";
import { db } from "../../../db";
import { sessions } from "../../../db/schema";
import { eq } from "drizzle-orm";

export async function POST({ request }: APIContext) {
  const { sessionId }: { sessionId: string } = await request.json();

  try {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false }, { status: 500 });
  }
}
