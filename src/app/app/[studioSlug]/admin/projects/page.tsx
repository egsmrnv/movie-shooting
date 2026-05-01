import { ProjectPersonRole } from "@prisma/client";
import { addProjectPersonAction, createProjectAction, deleteProjectPersonAction, updateProjectAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { projectPersonRoleLabels, singleProjectRoles } from "@/lib/constants";
import { requireAdmin } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export default async function ProjectsPage({ params }: { params: Promise<{ studioSlug: string }> }) {
  const { studioSlug } = await params;
  const { studio, member } = await requireAdmin(studioSlug);
  const [projects, members] = await Promise.all([
    prisma.project.findMany({
      where: { studioId: studio.id },
      include: { people: { include: { user: true }, orderBy: { createdAt: "asc" } } },
      orderBy: [{ isActive: "desc" }, { title: "asc" }]
    }),
    prisma.studioMember.findMany({
      where: { studioId: studio.id, status: "APPROVED" },
      include: { user: true },
      orderBy: { createdAt: "asc" }
    })
  ]);

  return (
    <AppShell studio={studio} member={member}>
      <div className="space-y-5">
        <Card>
          <CardTitle>Создать проект</CardTitle>
          <form action={createProjectAction.bind(null, studio.slug)} className="mt-5 grid gap-3 md:grid-cols-5">
            <Field label="Название">
              <Input name="title" required placeholder="Туманова / Гениус Киселёв" />
            </Field>
            <Field label="Короткое">
              <Input name="shortTitle" placeholder="Туманова" />
            </Field>
            <Field label="Emoji">
              <Input name="emoji" placeholder="🎬" />
            </Field>
            <input type="hidden" name="isActive" value="true" />
            <div className="flex items-end">
              <Button type="submit">Создать</Button>
            </div>
          </form>
        </Card>

        <div className="grid gap-4">
          {projects.map((project) => {
            const warnings = singleProjectRoles.filter(
              (role) => project.people.filter((person) => person.role === role).length > 1
            );
            return (
              <Card key={project.id}>
                <div className="flex flex-col justify-between gap-3 lg:flex-row">
                  <div>
                    <CardTitle>
                      {project.emoji ? `${project.emoji} ` : ""}
                      {project.title}
                    </CardTitle>
                    <CardDescription>{project.shortTitle || "Без короткого названия"}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{project.isActive ? "Активен" : "Архив"}</Badge>
                    <Button asChild variant="secondary" size="sm">
                      <a href={`/app/${studio.slug}/admin/projects/${project.id}/calendar`}>Календарь</a>
                    </Button>
                  </div>
                </div>
                {warnings.length > 0 ? (
                  <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-100">
                    Дубли одиночных ролей: {warnings.map((role) => projectPersonRoleLabels[role]).join(", ")}
                  </p>
                ) : null}
                <form action={updateProjectAction.bind(null, studio.slug, project.id)} className="mt-5 grid gap-3 md:grid-cols-5">
                  <Field label="Название">
                    <Input name="title" defaultValue={project.title} required />
                  </Field>
                  <Field label="Короткое">
                    <Input name="shortTitle" defaultValue={project.shortTitle || ""} />
                  </Field>
                  <Field label="Emoji">
                    <Input name="emoji" defaultValue={project.emoji || ""} />
                  </Field>
                  <Field label="Статус">
                    <Select name="isActive" defaultValue={String(project.isActive)}>
                      <option value="true">Активен</option>
                      <option value="false">Архив</option>
                    </Select>
                  </Field>
                  <div className="flex items-end">
                    <Button type="submit">Сохранить</Button>
                  </div>
                </form>

                <div className="mt-6 space-y-3 border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-white">Проектная команда</h3>
                  {project.people.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Пока никого нет.</p>
                  ) : (
                    <div className="grid gap-2">
                      {project.people.map((person) => (
                        <div key={person.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/[0.035] p-3 text-sm">
                          <span>
                            <span className="text-muted-foreground">{projectPersonRoleLabels[person.role]}:</span>{" "}
                            {person.user?.displayName || person.name}
                          </span>
                          <form action={deleteProjectPersonAction.bind(null, studio.slug, person.id)}>
                            <Button type="submit" variant="destructive" size="sm">
                              Удалить
                            </Button>
                          </form>
                        </div>
                      ))}
                    </div>
                  )}
                  <form action={addProjectPersonAction.bind(null, studio.slug, project.id)} className="grid gap-3 lg:grid-cols-5">
                    <Field label="Роль">
                      <Select name="role">
                        {Object.entries(projectPersonRoleLabels).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Участник">
                      <Select name="userId" defaultValue="">
                        <option value="">Внешний человек</option>
                        {members.map((item) => (
                          <option key={item.userId} value={item.userId}>
                            {item.displayName || item.user.displayName}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Имя, если нет аккаунта">
                      <Input name="name" placeholder="Имя" />
                    </Field>
                    <Field label="Заметка">
                      <Input name="note" />
                    </Field>
                    <div className="flex items-end">
                      <Button type="submit" variant="secondary">
                        Добавить
                      </Button>
                    </div>
                  </form>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
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
