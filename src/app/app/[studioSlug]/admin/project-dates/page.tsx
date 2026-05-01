import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { shiftRoleLabels } from "@/lib/constants";
import { requireAdmin } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { formatShortDate } from "@/lib/utils";

export default async function ProjectDatesPage({ params }: { params: Promise<{ studioSlug: string }> }) {
  const { studioSlug } = await params;
  const { studio, member } = await requireAdmin(studioSlug);
  const [projects, shifts] = await Promise.all([
    prisma.project.findMany({ where: { studioId: studio.id, isActive: true }, orderBy: { title: "asc" } }),
    prisma.shift.findMany({
      where: { studioId: studio.id },
      include: { project: true, vehicle: true, assignments: { include: { user: true } } },
      orderBy: { date: "asc" },
      take: 240
    })
  ]);
  const dates = [...new Set(shifts.map((shift) => formatShortDate(shift.date)))];

  return (
    <AppShell studio={studio} member={member}>
      <Card>
        <CardTitle>Проект × Даты</CardTitle>
        <CardDescription>Read-only сводка, сгенерированная из мастер-графика этой студии.</CardDescription>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="sticky left-0 bg-card px-3 py-3">Дата</th>
                {projects.map((project) => (
                  <th key={project.id} className="min-w-72 px-3 py-3">
                    {project.emoji ? `${project.emoji} ` : ""}
                    {project.shortTitle || project.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dates.map((date) => (
                <tr key={date} className="border-b border-border align-top">
                  <td className="sticky left-0 bg-card px-3 py-3 text-sm font-medium text-white">{date}</td>
                  {projects.map((project) => {
                    const dayShifts = shifts.filter((shift) => formatShortDate(shift.date) === date && shift.projectId === project.id);
                    return (
                      <td key={project.id} className="px-3 py-3">
                        <div className="space-y-2">
                          {dayShifts.map((shift) => (
                            <div key={shift.id} className="rounded-xl bg-white/[0.035] p-3 text-xs text-muted-foreground">
                              <div className="mb-2 flex flex-wrap gap-1">
                                <Badge>{shift.dayType}</Badge>
                                {shift.callSheetPath ? (
                                  <Link href={`/api/studios/${studio.slug}/call-sheets/${shift.id}`} target="_blank">
                                    <Badge className="text-primary">PDF</Badge>
                                  </Link>
                                ) : null}
                              </div>
                              <p>{shift.vehicle ? `${shift.vehicle.emoji || "🚐"} ${shift.vehicle.title}` : "Без машины"}</p>
                              <div className="mt-2 grid gap-1">
                                {Object.entries(groupAssignments(shift.assignments)).map(([role, names]) => (
                                  <p key={role}>
                                    <span className="text-white/75">{shiftRoleLabels[role as keyof typeof shiftRoleLabels]}:</span>{" "}
                                    {names.join(", ")}
                                  </p>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}

function groupAssignments(assignments: { role: keyof typeof shiftRoleLabels; user: { displayName: string } }[]) {
  return assignments.reduce<Record<string, string[]>>((acc, assignment) => {
    acc[assignment.role] ??= [];
    acc[assignment.role].push(assignment.user.displayName);
    return acc;
  }, {});
}
