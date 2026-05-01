import { notFound } from "next/navigation";
import { CompactShiftRow } from "@/components/admin/schedule-table";
import { AppShell } from "@/components/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { projectPersonRoleLabels } from "@/lib/constants";
import { requireAdmin } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export default async function ProjectCalendarPage({ params }: { params: Promise<{ studioSlug: string; projectId: string }> }) {
  const { studioSlug, projectId } = await params;
  const { studio, member } = await requireAdmin(studioSlug);
  const project = await prisma.project.findFirst({
    where: { id: projectId, studioId: studio.id },
    include: { people: { include: { user: true } } }
  });
  if (!project) notFound();
  const shifts = await prisma.shift.findMany({
    where: { studioId: studio.id, projectId: project.id },
    include: { project: true, vehicle: true, assignments: { include: { user: true } } },
    orderBy: { date: "asc" }
  });

  return (
    <AppShell studio={studio} member={member}>
      <div className="space-y-5">
        <Card>
          <CardTitle>
            {project.emoji ? `${project.emoji} ` : ""}
            {project.title}
          </CardTitle>
          <CardDescription>Проектный календарь из мастер-графика студии.</CardDescription>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {project.people.map((person) => (
              <div key={person.id} className="rounded-xl bg-white/[0.035] p-3 text-sm">
                <span className="text-muted-foreground">{projectPersonRoleLabels[person.role]}: </span>
                <span>{person.user?.displayName || person.name}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle>Смены проекта</CardTitle>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left">
              <tbody>{shifts.map((shift) => <CompactShiftRow key={shift.id} shift={shift as never} studioSlug={studio.slug} />)}</tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
