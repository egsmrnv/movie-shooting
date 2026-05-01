import Link from "next/link";
import { CalendarDays, Car, Grid3X3, Users, UserCheck, Video } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/access";

const links = [
  ["Пользователи", "admin/users", UserCheck, "Заявки, статусы, имена и уровни доступа."],
  ["Проекты", "admin/projects", Video, "Справочник проектов и проектная команда."],
  ["Машины", "admin/vehicles", Car, "Камервагены и транспорт студии."],
  ["Расписание", "admin/schedule", CalendarDays, "Мастер-график смен, PDF и назначения."],
  ["Проект × Даты", "admin/project-dates", Grid3X3, "Сводный read-only вид по проектам и датам."],
  ["Сотрудники", "admin/people-schedule", Users, "Смены по любому участнику студии."],
  ["Камервагены", "admin/vehicles-schedule", Car, "Смены по выбранной машине."]
] as const;

export default async function AdminPage({ params }: { params: Promise<{ studioSlug: string }> }) {
  const { studioSlug } = await params;
  const { studio, member } = await requireAdmin(studioSlug);
  return (
    <AppShell studio={studio} member={member}>
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-primary">админка</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{studio.title}</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {links.map(([title, href, Icon, description]) => (
            <Link key={href} href={`/app/${studio.slug}/${href}`}>
              <Card className="h-full transition hover:border-primary/45 hover:bg-white/[0.045]">
                <Icon className="h-5 w-5 text-primary" />
                <CardTitle className="mt-4">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
