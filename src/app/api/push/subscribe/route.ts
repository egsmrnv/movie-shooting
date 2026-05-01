import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1)
  })
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const payload = payloadSchema.parse(await request.json());

  await prisma.pushSubscription.upsert({
    where: { endpoint: payload.endpoint },
    update: {
      userId: user.id,
      p256dh: payload.keys.p256dh,
      auth: payload.keys.auth
    },
    create: {
      userId: user.id,
      endpoint: payload.endpoint,
      p256dh: payload.keys.p256dh,
      auth: payload.keys.auth
    }
  });

  return NextResponse.json({ ok: true });
}
