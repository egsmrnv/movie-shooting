import { AccessLevel, UserStatus } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const adminLevels: AccessLevel[] = ["OWNER", "ADMIN"];

export async function requireStudio(slug: string) {
  const user = await requireUser();
  const studio = await prisma.studio.findUnique({ where: { slug } });
  if (!studio) notFound();

  const member = await prisma.studioMember.findUnique({
    where: { studioId_userId: { studioId: studio.id, userId: user.id } },
    include: { user: true }
  });

  if (!member) redirect("/studios");
  if (member.status === "PENDING") redirect(`/app/${studio.slug}/pending`);
  if (member.status === "BLOCKED") redirect(`/app/${studio.slug}/blocked`);

  return { user, studio, member };
}

export async function requireStudioStatus(slug: string, status: UserStatus) {
  const user = await requireUser();
  const studio = await prisma.studio.findUnique({ where: { slug } });
  if (!studio) notFound();

  const member = await prisma.studioMember.findUnique({
    where: { studioId_userId: { studioId: studio.id, userId: user.id } }
  });
  if (!member) redirect("/studios");
  if (member.status !== status) redirect(`/app/${studio.slug}/dashboard`);
  return { user, studio, member };
}

export async function requireAdmin(slug: string) {
  const ctx = await requireStudio(slug);
  if (!adminLevels.includes(ctx.member.accessLevel)) redirect(`/app/${ctx.studio.slug}/dashboard`);
  return ctx;
}

export async function requireOwner(slug: string) {
  const ctx = await requireStudio(slug);
  if (ctx.member.accessLevel !== "OWNER") redirect(`/app/${ctx.studio.slug}/admin`);
  return ctx;
}

export async function getMembershipOrThrow(studioId: string, userId: string) {
  const member = await prisma.studioMember.findUnique({
    where: { studioId_userId: { studioId, userId } }
  });
  if (!member || member.status !== "APPROVED") throw new Error("Нет доступа к студии.");
  return member;
}

export function isAdminAccess(accessLevel: AccessLevel) {
  return adminLevels.includes(accessLevel);
}
