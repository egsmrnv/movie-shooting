import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { projectPersonRoleLabels, shiftRoleLabels, singleShiftRoles } from "@/lib/constants";
import { requireAdmin } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function ShiftDetailPage({ params }: { params: Promise<{ studioSlug: string; shiftId: string }> }) {
  const { studioSlug, shiftId } = await params;
  const { studio, member } = await requireAdmin(studioSlug);
  const shift = await prisma.shift.findFirst({
    where: { id: shiftId, studioId: studio.id },
    include: {
      project: { include: { people: { include: { user: true } } } },
      vehicle: true,
      assignments: { include: { user: true } }
    }
  });
  if (!shift) notFound();
  const warnings = singleShiftRoles.filter((role) => shift.assignments.filter((assignment) => assignment.role === role).length > 1);

  return (
    <AppShell studio={studio} member={member}>
      <div className="space-y-5">
        <Card>
          <div className="flex flex-col justify-between gap-3 sm:flex-row">
            <div>
              <CardTitle>
                {shift.project.emoji ? `${shift.project.emoji} ` : ""}
                {shift.project.title}
              </CardTitle>
              <CardDescription>{formatDate(shift.date)}</CardDescription>
            </div>
            <Badge className="border-primary/30 bg-primary/10 text-red-100">{shift.dayType}</Badge>
          </div>
          <div className="mt-5 grid gap-2 text-sm text-muted-foreground">
            <p>Машина: {shift.vehicle ? `${shift.vehicle.emoji || "🚐"} ${shift.vehicle.title} ${shift.vehicle.plate || ""}` : "Нет"}</p>
            {shift.note ? <p className="text-white/85">{shift.note}</p> : null}
          </div>
          {shift.callSheetPath ? (
            <Button asChild variant="secondary" className="mt-5">
              <Link href={`/api/studios/${studio.slug}/call-sheets/${shift.id}`} target="_blank">
                Открыть PDF вызывной
              </Link>
            </Button>
          ) : null}
        </Card>

        {warnings.length > 0 ? (
          <Card className="border-red-500/20 bg-red-500/10">
            <CardTitle>Предупреждение</CardTitle>
            <CardDescription className="text-red-100">
              Несколько назначений для одиночных ролей: {warnings.map((role) => shiftRoleLabels[role]).join(", ")}
            </CardDescription>
          </Card>
        ) : null}

        <Card>
          <CardTitle>Назначенные пользователи</CardTitle>
          <div className="mt-4 grid gap-2">
            {shift.assignments.map((assignment) => (
              <div key={assignment.id} className="rounded-xl bg-white/[0.035] p-3 text-sm">
                <span className="font-medium text-white">{assignment.user.displayName}</span>
                <span className="text-muted-foreground"> · {shiftRoleLabels[assignment.role]}</span>
                {assignment.note ? <p className="mt-1 text-muted-foreground">{assignment.note}</p> : null}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Проектная команда</CardTitle>
          <div className="mt-4 grid gap-2">
            {shift.project.people.map((person) => (
              <div key={person.id} className="rounded-xl bg-white/[0.035] p-3 text-sm">
                <span className="text-muted-foreground">{projectPersonRoleLabels[person.role]}: </span>
                <span className="text-white">{person.user?.displayName || person.name}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>История изменений</CardTitle>
          <CardDescription>Полноценный audit log не входит в первый MVP. Здесь зарезервировано место под будущую историю.</CardDescription>
        </Card>
      </div>
    </AppShell>
  );
}
