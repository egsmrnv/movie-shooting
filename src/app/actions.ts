"use server";

import { AccessLevel, ProjectPersonRole, ShiftRole, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, requireOwner, requireStudio } from "@/lib/access";
import { shiftRoleLabels } from "@/lib/constants";
import { notifyApprovedStudioUser } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { saveCallSheet } from "@/lib/uploads";
import { parseDateInput, slugify } from "@/lib/utils";

const text = z.string().trim();
const optionalText = z.string().trim().optional().transform((value) => value || null);
const slugSchema = z.string().trim().min(2).max(64).regex(/^[a-z0-9-]+$/);

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

function values(formData: FormData, key: string) {
  return formData.getAll(key).filter((item): item is string => typeof item === "string" && item.length > 0);
}

export async function createStudioAction(formData: FormData) {
  const { requireUser } = await import("@/lib/auth");
  const user = await requireUser();
  const parsed = z
    .object({
      title: text.min(2),
      slug: slugSchema,
      description: optionalText
    })
    .parse({
      title: value(formData, "title"),
      slug: value(formData, "username") || slugify(value(formData, "title")),
      description: value(formData, "description")
    });

  const studio = await prisma.studio.create({
    data: {
      ...parsed,
      members: {
        create: {
          userId: user.id,
          status: "APPROVED",
          accessLevel: "OWNER"
        }
      }
    }
  });
  redirect(`/app/${studio.slug}/dashboard`);
}

export async function joinStudioAction(formData: FormData) {
  const { requireUser } = await import("@/lib/auth");
  const user = await requireUser();
  const slug = slugSchema.parse(value(formData, "username"));
  const studio = await prisma.studio.findUnique({ where: { slug } });
  if (!studio) throw new Error("Студия с таким username не найдена.");

  const member = await prisma.studioMember.upsert({
    where: { studioId_userId: { studioId: studio.id, userId: user.id } },
    update: {},
    create: {
      studioId: studio.id,
      userId: user.id,
      status: "PENDING",
      accessLevel: "USER"
    }
  });

  if (member.status === "APPROVED") redirect(`/app/${studio.slug}/dashboard`);
  if (member.status === "BLOCKED") redirect(`/app/${studio.slug}/blocked`);
  redirect(`/app/${studio.slug}/pending`);
}

export async function updateMemberAction(studioSlug: string, memberId: string, formData: FormData) {
  const ctx = await requireAdmin(studioSlug);
  const target = await prisma.studioMember.findFirst({
    where: { id: memberId, studioId: ctx.studio.id }
  });
  if (!target) throw new Error("Участник не найден.");

  const nextStatus = z.nativeEnum(UserStatus).parse(value(formData, "status"));
  const nextAccess = z.nativeEnum(AccessLevel).parse(value(formData, "accessLevel"));
  const displayName = optionalText.parse(value(formData, "displayName"));
  const roleNote = optionalText.parse(value(formData, "roleNote"));

  if (target.accessLevel === "OWNER" && ctx.member.accessLevel !== "OWNER") {
    throw new Error("Администратор не может редактировать владельца.");
  }
  if (nextAccess !== target.accessLevel) {
    if (ctx.member.accessLevel !== "OWNER") throw new Error("Только владелец может менять уровень доступа.");
    if (nextAccess === "OWNER") throw new Error("Передача владения пока выполняется вручную в базе.");
    if (target.accessLevel === "OWNER") {
      const owners = await prisma.studioMember.count({
        where: { studioId: ctx.studio.id, accessLevel: "OWNER", status: "APPROVED" }
      });
      if (owners <= 1) throw new Error("Нельзя снять последнего владельца студии.");
    }
  }

  await prisma.studioMember.update({
    where: { id: memberId },
    data: { status: nextStatus, accessLevel: nextAccess, displayName, roleNote }
  });
  revalidatePath(`/app/${studioSlug}/admin/users`);
}

export async function createProjectAction(studioSlug: string, formData: FormData) {
  const { studio } = await requireAdmin(studioSlug);
  await prisma.project.create({
    data: {
      studioId: studio.id,
      title: text.min(1).parse(value(formData, "title")),
      shortTitle: optionalText.parse(value(formData, "shortTitle")),
      emoji: optionalText.parse(value(formData, "emoji")),
      isActive: value(formData, "isActive") !== "false"
    }
  });
  revalidatePath(`/app/${studioSlug}/admin/projects`);
}

export async function updateProjectAction(studioSlug: string, projectId: string, formData: FormData) {
  const { studio } = await requireAdmin(studioSlug);
  await prisma.project.updateMany({
    where: { id: projectId, studioId: studio.id },
    data: {
      title: text.min(1).parse(value(formData, "title")),
      shortTitle: optionalText.parse(value(formData, "shortTitle")),
      emoji: optionalText.parse(value(formData, "emoji")),
      isActive: value(formData, "isActive") === "true"
    }
  });
  revalidatePath(`/app/${studioSlug}/admin/projects`);
}

export async function addProjectPersonAction(studioSlug: string, projectId: string, formData: FormData) {
  const { studio } = await requireAdmin(studioSlug);
  const userId = optionalText.parse(value(formData, "userId"));
  const name = optionalText.parse(value(formData, "name"));
  if (!userId && !name) throw new Error("Выберите участника или укажите имя.");
  if (userId) await assertApprovedMember(studio.id, userId);

  await prisma.projectPerson.create({
    data: {
      studioId: studio.id,
      projectId,
      role: z.nativeEnum(ProjectPersonRole).parse(value(formData, "role")),
      userId,
      name,
      note: optionalText.parse(value(formData, "note"))
    }
  });
  revalidatePath(`/app/${studioSlug}/admin/projects`);
}

export async function deleteProjectPersonAction(studioSlug: string, personId: string) {
  const { studio } = await requireAdmin(studioSlug);
  await prisma.projectPerson.deleteMany({ where: { id: personId, studioId: studio.id } });
  revalidatePath(`/app/${studioSlug}/admin/projects`);
}

export async function createVehicleAction(studioSlug: string, formData: FormData) {
  const { studio } = await requireAdmin(studioSlug);
  await prisma.vehicle.create({
    data: {
      studioId: studio.id,
      title: text.min(1).parse(value(formData, "title")),
      plate: optionalText.parse(value(formData, "plate")),
      emoji: optionalText.parse(value(formData, "emoji")),
      isActive: value(formData, "isActive") !== "false"
    }
  });
  revalidatePath(`/app/${studioSlug}/admin/vehicles`);
}

export async function updateVehicleAction(studioSlug: string, vehicleId: string, formData: FormData) {
  const { studio } = await requireAdmin(studioSlug);
  await prisma.vehicle.updateMany({
    where: { id: vehicleId, studioId: studio.id },
    data: {
      title: text.min(1).parse(value(formData, "title")),
      plate: optionalText.parse(value(formData, "plate")),
      emoji: optionalText.parse(value(formData, "emoji")),
      isActive: value(formData, "isActive") === "true"
    }
  });
  revalidatePath(`/app/${studioSlug}/admin/vehicles`);
}

export async function createShiftAction(studioSlug: string, formData: FormData) {
  const { studio } = await requireAdmin(studioSlug);
  const projectId = text.min(1).parse(value(formData, "projectId"));
  await assertProject(studio.id, projectId);
  const vehicleId = optionalText.parse(value(formData, "vehicleId"));
  if (vehicleId) await assertVehicle(studio.id, vehicleId);

  const shift = await prisma.shift.create({
    data: {
      studioId: studio.id,
      date: parseDateInput(value(formData, "date")),
      projectId,
      dayType: text.min(1).parse(value(formData, "dayType")),
      vehicleId,
      note: optionalText.parse(value(formData, "note"))
    }
  });

  await syncAssignments(studio.id, shift.id, formData);
  const file = formData.get("callSheet");
  if (file instanceof File && file.size > 0) {
    const callSheetPath = await saveCallSheet(studio.id, shift.id, file);
    await prisma.shift.update({ where: { id: shift.id }, data: { callSheetPath } });
  }
  await notifyShiftUsers(studio.id, shift.id, "Новая смена");
  revalidatePath(`/app/${studioSlug}/admin/schedule`);
}

export async function updateShiftAction(studioSlug: string, shiftId: string, formData: FormData) {
  const { studio } = await requireAdmin(studioSlug);
  const current = await prisma.shift.findFirst({ where: { id: shiftId, studioId: studio.id } });
  if (!current) throw new Error("Смена не найдена.");
  const projectId = text.min(1).parse(value(formData, "projectId"));
  await assertProject(studio.id, projectId);
  const vehicleId = optionalText.parse(value(formData, "vehicleId"));
  if (vehicleId) await assertVehicle(studio.id, vehicleId);

  await prisma.shift.update({
    where: { id: shiftId },
    data: {
      date: parseDateInput(value(formData, "date")),
      projectId,
      dayType: text.min(1).parse(value(formData, "dayType")),
      vehicleId,
      note: optionalText.parse(value(formData, "note"))
    }
  });
  await syncAssignments(studio.id, shiftId, formData);
  const file = formData.get("callSheet");
  if (file instanceof File && file.size > 0) {
    const callSheetPath = await saveCallSheet(studio.id, shiftId, file);
    await prisma.shift.update({ where: { id: shiftId }, data: { callSheetPath } });
  }
  await notifyShiftUsers(studio.id, shiftId, "Расписание изменилось");
  revalidatePath(`/app/${studioSlug}/admin/schedule`);
  revalidatePath(`/app/${studioSlug}/admin/schedule/${shiftId}`);
}

export async function deleteShiftAction(studioSlug: string, shiftId: string) {
  const { studio } = await requireAdmin(studioSlug);
  await prisma.shift.deleteMany({ where: { id: shiftId, studioId: studio.id } });
  revalidatePath(`/app/${studioSlug}/admin/schedule`);
  redirect(`/app/${studioSlug}/admin/schedule`);
}

async function syncAssignments(studioId: string, shiftId: string, formData: FormData) {
  const userIds = formData.getAll("assignmentUserId").map((item) => (typeof item === "string" ? item : ""));
  const roles = formData.getAll("assignmentRole").map((item) => (typeof item === "string" ? item : ""));
  const notes = formData.getAll("assignmentNote").map((item) => (typeof item === "string" ? item : ""));
  const assignments = userIds
    .map((userId, index) => ({
      userId,
      role: roles[index],
      note: notes[index] || null
    }))
    .filter((assignment) => assignment.userId)
    .map((assignment) => ({
      userId: assignment.userId,
      role: z.nativeEnum(ShiftRole).parse(assignment.role),
      note: assignment.note
    }));

  for (const assignment of assignments) {
    await assertApprovedMember(studioId, assignment.userId);
  }

  await prisma.$transaction([
    prisma.assignment.deleteMany({ where: { studioId, shiftId } }),
    ...assignments.map((assignment) =>
      prisma.assignment.create({
        data: {
          studioId,
          shiftId,
          userId: assignment.userId,
          role: assignment.role,
          note: assignment.note
        }
      })
    )
  ]);
}

async function notifyShiftUsers(studioId: string, shiftId: string, prefix: string) {
  const shift = await prisma.shift.findFirst({
    where: { id: shiftId, studioId },
    include: { project: true, assignments: true }
  });
  if (!shift) return;
  await Promise.all(
    shift.assignments.map((assignment) =>
      notifyApprovedStudioUser({
        studioId,
        userId: assignment.userId,
        title: `${prefix}: ${shift.project.shortTitle || shift.project.title} — ${shiftRoleLabels[assignment.role]}`,
        body: `${shift.dayType}. Откройте кабинет для деталей.`
      })
    )
  );
}

async function assertApprovedMember(studioId: string, userId: string) {
  const member = await prisma.studioMember.findUnique({
    where: { studioId_userId: { studioId, userId } }
  });
  if (!member || member.status !== "APPROVED") throw new Error("Назначать можно только подтверждённых участников этой студии.");
}

async function assertProject(studioId: string, projectId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, studioId } });
  if (!project) throw new Error("Проект не найден в этой студии.");
}

async function assertVehicle(studioId: string, vehicleId: string) {
  const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, studioId } });
  if (!vehicle) throw new Error("Машина не найдена в этой студии.");
}
