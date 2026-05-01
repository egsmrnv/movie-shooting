import { CompactShiftRow } from "@/components/admin/schedule-table";
import { AppShell } from "@/components/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export default async function PeopleSchedulePage({
  params,
  searchParams
}: {
  params: Promise<{ studioSlug: string }>;
  searchParams: Promise<{ userId?: string }>;
}) {
  const [{ studioSlug }, query] = await Promise.all([params, searchParams]);
  const { studio, member } = await requireAdmin(studioSlug);
  const members = await prisma.studioMember.findMany({
    where: { studioId: studio.id, status: "APPROVED" },
    include: { user: true },
    orderBy: { createdAt: "asc" }
  });
  const selectedUserId = query.userId || members[0]?.userId;
  const shifts = selectedUserId
    ? await prisma.shift.findMany({
        where: { studioId: studio.id, assignments: { some: { userId: selectedUserId } } },
        include: { project: true, vehicle: true, assignments: { where: { userId: selectedUserId }, include: { user: true } } },
        orderBy: { date: "asc" }
      })
    : [];

  return (
    <AppShell studio={studio} member={member}>
      <Card>
        <CardTitle>Сотрудники</CardTitle>
        <CardDescription>Выберите участника и посмотрите все его смены внутри текущей студии.</CardDescription>
        <div className="mt-5 flex flex-wrap gap-2">
          {members.map((item) => (
            <a
              key={item.userId}
              href={`/app/${studio.slug}/admin/people-schedule?userId=${item.userId}`}
              className={`rounded-xl border px-3 py-2 text-sm ${
                selectedUserId === item.userId ? "border-primary bg-primary/12 text-white" : "border-border bg-white/[0.035] text-muted-foreground"
              }`}
            >
              {item.displayName || item.user.displayName}
            </a>
          ))}
        </div>
        <ScheduleTable shifts={shifts as never} studioSlug={studio.slug} />
      </Card>
    </AppShell>
  );
}

function ScheduleTable({ shifts, studioSlug }: { shifts: any[]; studioSlug: string }) {
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-left">
        <tbody>{shifts.map((shift) => <CompactShiftRow key={shift.id} shift={shift} studioSlug={studioSlug} />)}</tbody>
      </table>
    </div>
  );
}
