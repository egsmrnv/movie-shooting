import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { canCreateStudios, userStatusLabels } from "@/lib/constants";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function StudiosPage() {
  const user = await requireUser();
  const memberships = await prisma.studioMember.findMany({
    where: { userId: user.id },
    include: { studio: true },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }]
  });

  const approved = memberships.filter((membership) => membership.status === "APPROVED");
  if (approved.length === 1 && memberships.length === 1) {
    redirect(`/app/${approved[0].studio.slug}/dashboard`);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-primary">студии</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Выбор студии</h1>
            <p className="mt-2 text-muted-foreground">Один аккаунт может работать в нескольких независимых студиях.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canCreateStudios() ? (
              <Button asChild>
                <Link href="/studios/new">
                  <Plus className="h-4 w-4" />
                  Создать студию
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="secondary">
              <Link href="/studios/join">
                <Search className="h-4 w-4" />
                Запросить доступ
              </Link>
            </Button>
          </div>
        </div>

        {memberships.length === 0 ? (
          <EmptyState
            title="Пока нет студий"
            description={
              canCreateStudios()
                ? "Создайте новую студию или запросите доступ по slug у администратора."
                : "Запросите доступ к существующей студии. Администратор подтвердит заявку."
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {memberships.map((membership) => (
              <Card key={membership.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{membership.studio.title}</CardTitle>
                    <CardDescription>{membership.studio.description || `/${membership.studio.slug}`}</CardDescription>
                  </div>
                  <Badge>{userStatusLabels[membership.status]}</Badge>
                </div>
                <div className="mt-5">
                  <Button asChild variant={membership.status === "APPROVED" ? "default" : "secondary"}>
                    <Link
                      href={
                        membership.status === "APPROVED"
                          ? `/app/${membership.studio.slug}/dashboard`
                          : `/app/${membership.studio.slug}/${membership.status === "PENDING" ? "pending" : "blocked"}`
                      }
                    >
                      Открыть
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
