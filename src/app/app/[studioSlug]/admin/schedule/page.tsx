import Link from "next/link";
import { createShiftAction, deleteShiftAction, updateShiftAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DAY_TYPES, shiftRoleLabels, singleShiftRoles } from "@/lib/constants";
import { requireAdmin } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { formatShortDate, toDateInputValue } from "@/lib/utils";

export default async function SchedulePage({ params }: { params: Promise<{ studioSlug: string }> }) {
  const { studioSlug } = await params;
  const { studio, member } = await requireAdmin(studioSlug);
  const [projects, vehicles, members, shifts] = await Promise.all([
    prisma.project.findMany({ where: { studioId: studio.id, isActive: true }, orderBy: { title: "asc" } }),
    prisma.vehicle.findMany({ where: { studioId: studio.id, isActive: true }, orderBy: { title: "asc" } }),
    prisma.studioMember.findMany({
      where: { studioId: studio.id, status: "APPROVED" },
      include: { user: true },
      orderBy: { createdAt: "asc" }
    }),
    prisma.shift.findMany({
      where: { studioId: studio.id },
      include: { project: true, vehicle: true, assignments: { include: { user: true } } },
      orderBy: { date: "asc" },
      take: 80
    })
  ]);

  return (
    <AppShell studio={studio} member={member}>
      <div className="space-y-5">
        <Card>
          <CardTitle>Создать смену</CardTitle>
          <CardDescription>Мастер-график хранится в базе, а остальные виды строятся из этих смен.</CardDescription>
          <ShiftForm
            action={createShiftAction.bind(null, studio.slug)}
            projects={projects}
            vehicles={vehicles}
            members={members}
          />
        </Card>

        <div className="space-y-4">
          {shifts.map((shift) => (
            <Card key={shift.id}>
              <div className="flex flex-col justify-between gap-3 lg:flex-row">
                <div>
                  <CardTitle>
                    {formatShortDate(shift.date)} · {shift.project.emoji ? `${shift.project.emoji} ` : ""}
                    {shift.project.shortTitle || shift.project.title}
                  </CardTitle>
                  <CardDescription>{shift.dayType}</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {shift.callSheetPath ? <Badge>PDF</Badge> : null}
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/app/${studio.slug}/admin/schedule/${shift.id}`}>Детали</Link>
                  </Button>
                  <form action={deleteShiftAction.bind(null, studio.slug, shift.id)}>
                    <Button type="submit" variant="destructive" size="sm">
                      Удалить
                    </Button>
                  </form>
                </div>
              </div>
              <RoleWarnings assignments={shift.assignments} />
              <ShiftForm
                action={updateShiftAction.bind(null, studio.slug, shift.id)}
                projects={projects}
                vehicles={vehicles}
                members={members}
                shift={shift}
              />
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function ShiftForm({
  action,
  projects,
  vehicles,
  members,
  shift
}: {
  action: (formData: FormData) => void;
  projects: Awaited<ReturnType<typeof prisma.project.findMany>>;
  vehicles: Awaited<ReturnType<typeof prisma.vehicle.findMany>>;
  members: Awaited<ReturnType<typeof prisma.studioMember.findMany>>;
  shift?: any;
}) {
  const rows = [...(shift?.assignments || []), ...Array.from({ length: shift ? 2 : 4 })];
  return (
    <form action={action} encType="multipart/form-data" className="mt-5 grid gap-4">
      <div className="grid gap-3 md:grid-cols-5">
        <Field label="Дата">
          <Input name="date" type="date" defaultValue={shift ? toDateInputValue(shift.date) : toDateInputValue(new Date())} required />
        </Field>
        <Field label="Проект">
          <Select name="projectId" defaultValue={shift?.projectId} required>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.emoji ? `${project.emoji} ` : ""}
                {project.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Тип дня">
          <Select name="dayType" defaultValue={shift?.dayType || "Смена"}>
            {DAY_TYPES.map((dayType) => (
              <option key={dayType} value={dayType}>
                {dayType}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Машина">
          <Select name="vehicleId" defaultValue={shift?.vehicleId || ""}>
            <option value="">Нет</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.emoji || "🚐"} {vehicle.title} {vehicle.plate || ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="PDF вызывной">
          <Input name="callSheet" type="file" accept="application/pdf,.pdf" />
        </Field>
      </div>
      <Field label="Комментарий">
        <Textarea name="note" defaultValue={shift?.note || ""} />
      </Field>
      <div className="space-y-2">
        <Label>Назначения</Label>
        <div className="grid gap-2">
          {rows.map((assignment: any, index) => (
            <div key={assignment?.id || index} className="grid gap-2 rounded-xl bg-white/[0.035] p-3 md:grid-cols-3">
              <Select name="assignmentUserId" defaultValue={assignment?.userId || ""}>
                <option value="">Не выбрано</option>
                {members.map((item: any) => (
                  <option key={item.userId} value={item.userId}>
                    {item.displayName || item.user.displayName}
                  </option>
                ))}
              </Select>
              <Select name="assignmentRole" defaultValue={assignment?.role || "ASSISTANT"}>
                {Object.entries(shiftRoleLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </Select>
              <Input name="assignmentNote" defaultValue={assignment?.note || ""} placeholder="Заметка" />
            </div>
          ))}
        </div>
      </div>
      <Button type="submit">{shift ? "Сохранить смену" : "Создать смену"}</Button>
    </form>
  );
}

function RoleWarnings({ assignments }: { assignments: { role: keyof typeof shiftRoleLabels }[] }) {
  const warnings = singleShiftRoles.filter((role) => assignments.filter((assignment) => assignment.role === role).length > 1);
  if (warnings.length === 0) return null;
  return (
    <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-100">
      Проверьте дубли одиночных ролей: {warnings.map((role) => shiftRoleLabels[role]).join(", ")}
    </p>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
