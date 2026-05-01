import { updateMemberAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { accessLevelLabels, userStatusLabels } from "@/lib/constants";
import { requireAdmin } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export default async function UsersPage({ params }: { params: Promise<{ studioSlug: string }> }) {
  const { studioSlug } = await params;
  const { studio, member } = await requireAdmin(studioSlug);
  const members = await prisma.studioMember.findMany({
    where: { studioId: studio.id },
    include: { user: true },
    orderBy: [{ status: "asc" }, { accessLevel: "asc" }, { createdAt: "asc" }]
  });
  const isOwner = member.accessLevel === "OWNER";

  return (
    <AppShell studio={studio} member={member}>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold text-white">Пользователи</h1>
          <p className="mt-1 text-sm text-muted-foreground">Все действия ограничены текущей студией.</p>
        </div>
        <div className="grid gap-4">
          {members.map((studioMember) => {
            const canEditAccess = isOwner && studioMember.accessLevel !== "OWNER";
            const cannotEditOwner = studioMember.accessLevel === "OWNER" && !isOwner;
            return (
              <Card key={studioMember.id}>
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <CardTitle>{studioMember.displayName || studioMember.user.displayName}</CardTitle>
                    <CardDescription>{studioMember.user.email}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{userStatusLabels[studioMember.status]}</Badge>
                    <Badge>{accessLevelLabels[studioMember.accessLevel]}</Badge>
                  </div>
                </div>
                <form action={updateMemberAction.bind(null, studio.slug, studioMember.id)} className="mt-5 grid gap-3 lg:grid-cols-5">
                  <div>
                    <Label>Имя в студии</Label>
                    <Input name="displayName" defaultValue={studioMember.displayName || ""} disabled={cannotEditOwner} />
                  </div>
                  <div>
                    <Label>Заметка</Label>
                    <Input name="roleNote" defaultValue={studioMember.roleNote || ""} disabled={cannotEditOwner} />
                  </div>
                  <div>
                    <Label>Статус</Label>
                    <Select name="status" defaultValue={studioMember.status} disabled={cannotEditOwner}>
                      {Object.entries(userStatusLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Доступ</Label>
                    <Select name="accessLevel" defaultValue={studioMember.accessLevel} disabled={!canEditAccess}>
                      {Object.entries(accessLevelLabels).map(([key, label]) => (
                        <option key={key} value={key} disabled={key === "OWNER"}>
                          {label}
                        </option>
                      ))}
                    </Select>
                    {!canEditAccess ? <input type="hidden" name="accessLevel" value={studioMember.accessLevel} /> : null}
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" disabled={cannotEditOwner}>
                      Сохранить
                    </Button>
                  </div>
                </form>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
