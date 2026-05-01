import { NotificationSettings } from "@/components/notification-settings";
import { EmptyState } from "@/components/empty-state";
import { AppShell } from "@/components/app-shell";
import { ShiftCard } from "@/components/shift-card";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireStudio } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { startOfLocalDay } from "@/lib/utils";

export default async function DashboardPage({ params }: { params: Promise<{ studioSlug: string }> }) {
  const { studioSlug } = await params;
  const { user, studio, member } = await requireStudio(studioSlug);
  const today = startOfLocalDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const afterTomorrow = new Date(today);
  afterTomorrow.setDate(afterTomorrow.getDate() + 2);

  const shifts = await prisma.shift.findMany({
    where: {
      studioId: studio.id,
      date: { gte: today },
      assignments: { some: { userId: user.id } }
    },
    include: {
      project: { include: { people: { include: { user: true } } } },
      vehicle: true,
      assignments: { where: { userId: user.id }, include: { user: true } }
    },
    orderBy: { date: "asc" },
    take: 20
  });

  const todayShifts = shifts.filter((shift) => shift.date >= today && shift.date < tomorrow);
  const tomorrowShifts = shifts.filter((shift) => shift.date >= tomorrow && shift.date < afterTomorrow);
  const futureShifts = shifts.filter((shift) => shift.date >= afterTomorrow);

  return (
    <AppShell studio={studio} member={member}>
      <div className="space-y-6">
        <Card>
          <CardTitle>Личный кабинет</CardTitle>
          <CardDescription>
            Ваши смены внутри студии {studio.title}. Обычный пользователь видит только собственные назначения.
          </CardDescription>
        </Card>
        <NotificationSettings vapidPublicKey={process.env.VAPID_PUBLIC_KEY} />
        <ShiftGroup title="Сегодня" shifts={todayShifts} studioSlug={studio.slug} userId={user.id} />
        <ShiftGroup title="Завтра" shifts={tomorrowShifts} studioSlug={studio.slug} userId={user.id} />
        <ShiftGroup title="Ближайшие смены" shifts={futureShifts} studioSlug={studio.slug} userId={user.id} />
      </div>
    </AppShell>
  );
}

function ShiftGroup({
  title,
  shifts,
  studioSlug,
  userId
}: {
  title: string;
  shifts: Awaited<ReturnType<typeof prisma.shift.findMany>>;
  studioSlug: string;
  userId: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      {shifts.length === 0 ? (
        <EmptyState title="Нет смен" description="Здесь появятся назначенные вам смены." />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {shifts.map((shift) => (
            <ShiftCard key={shift.id} shift={shift as never} studioSlug={studioSlug} userId={userId} />
          ))}
        </div>
      )}
    </section>
  );
}
