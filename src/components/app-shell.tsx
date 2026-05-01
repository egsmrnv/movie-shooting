import Link from "next/link";
import { AccessLevel, Studio, StudioMember } from "@prisma/client";
import { Camera, ChevronDown, LayoutDashboard, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { accessLevelLabels } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export async function AppShell({
  studio,
  member,
  children
}: {
  studio: Studio;
  member: StudioMember;
  children: React.ReactNode;
}) {
  const studios = await prisma.studioMember.findMany({
    where: { userId: member.userId, status: { in: ["APPROVED", "PENDING"] } },
    include: { studio: true },
    orderBy: { createdAt: "asc" }
  });
  const canAdmin = member.accessLevel === "OWNER" || member.accessLevel === "ADMIN";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-black/82 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link href={`/app/${studio.slug}/dashboard`} className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-white shadow-[0_0_26px_rgba(229,9,20,0.35)]">
              <Camera className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-white">{studio.title}</span>
              <span className="block truncate text-xs text-muted-foreground">26 FPS Schedule</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {studios.length > 1 ? (
              <Button asChild variant="secondary" size="sm">
                <Link href="/studios">
                  <ChevronDown className="h-4 w-4" />
                  Студии
                </Link>
              </Button>
            ) : null}
            <Badge>{accessLevelLabels[member.accessLevel as AccessLevel]}</Badge>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-5 sm:py-8">
        <nav className="mb-5 flex gap-2 overflow-x-auto pb-1">
          <Button asChild variant="secondary" size="sm">
            <Link href={`/app/${studio.slug}/dashboard`}>
              <LayoutDashboard className="h-4 w-4" />
              Кабинет
            </Link>
          </Button>
          {canAdmin ? (
            <Button asChild variant="secondary" size="sm">
              <Link href={`/app/${studio.slug}/admin`}>
                <Settings className="h-4 w-4" />
                Админка
              </Link>
            </Button>
          ) : null}
        </nav>
        {children}
      </main>
    </div>
  );
}
