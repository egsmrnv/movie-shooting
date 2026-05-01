import webPush from "web-push";
import { prisma } from "@/lib/prisma";

let configured = false;

function configureWebPush() {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject || publicKey === "replace-me") return false;
  webPush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export async function notifyApprovedStudioUser(params: {
  studioId: string;
  userId: string;
  title: string;
  body: string;
}) {
  const member = await prisma.studioMember.findUnique({
    where: { studioId_userId: { studioId: params.studioId, userId: params.userId } }
  });
  if (!member || member.status !== "APPROVED") return;
  if (!configureWebPush()) return;

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId: params.userId } });
  await Promise.allSettled(
    subscriptions.map((subscription) =>
      webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth }
        },
        JSON.stringify({ title: params.title, body: params.body })
      )
    )
  );
}
