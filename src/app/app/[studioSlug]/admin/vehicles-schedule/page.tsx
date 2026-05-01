import { CompactShiftRow } from "@/components/admin/schedule-table";
import { AppShell } from "@/components/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export default async function VehiclesSchedulePage({
  params,
  searchParams
}: {
  params: Promise<{ studioSlug: string }>;
  searchParams: Promise<{ vehicleId?: string }>;
}) {
  const [{ studioSlug }, query] = await Promise.all([params, searchParams]);
  const { studio, member } = await requireAdmin(studioSlug);
  const vehicles = await prisma.vehicle.findMany({ where: { studioId: studio.id }, orderBy: { title: "asc" } });
  const selectedVehicleId = query.vehicleId || vehicles[0]?.id;
  const shifts = selectedVehicleId
    ? await prisma.shift.findMany({
        where: { studioId: studio.id, vehicleId: selectedVehicleId },
        include: { project: true, vehicle: true, assignments: { include: { user: true } } },
        orderBy: { date: "asc" }
      })
    : [];

  return (
    <AppShell studio={studio} member={member}>
      <Card>
        <CardTitle>Камервагены</CardTitle>
        <CardDescription>Смены по выбранной машине. Пустой транспорт означает “Нет”.</CardDescription>
        <div className="mt-5 flex flex-wrap gap-2">
          {vehicles.map((vehicle) => (
            <a
              key={vehicle.id}
              href={`/app/${studio.slug}/admin/vehicles-schedule?vehicleId=${vehicle.id}`}
              className={`rounded-xl border px-3 py-2 text-sm ${
                selectedVehicleId === vehicle.id ? "border-primary bg-primary/12 text-white" : "border-border bg-white/[0.035] text-muted-foreground"
              }`}
            >
              {vehicle.emoji || "🚐"} {vehicle.title}
            </a>
          ))}
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <tbody>{shifts.map((shift) => <CompactShiftRow key={shift.id} shift={shift as never} studioSlug={studio.slug} />)}</tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
