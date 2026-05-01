import { createVehicleAction, updateVehicleAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { requireAdmin } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export default async function VehiclesPage({ params }: { params: Promise<{ studioSlug: string }> }) {
  const { studioSlug } = await params;
  const { studio, member } = await requireAdmin(studioSlug);
  const vehicles = await prisma.vehicle.findMany({
    where: { studioId: studio.id },
    orderBy: [{ isActive: "desc" }, { title: "asc" }]
  });

  return (
    <AppShell studio={studio} member={member}>
      <div className="space-y-5">
        <Card>
          <CardTitle>Новая машина</CardTitle>
          <CardDescription>“Нет” не создаётся как машина: для этого у смены пустой транспорт.</CardDescription>
          <form action={createVehicleAction.bind(null, studio.slug)} className="mt-5 grid gap-3 md:grid-cols-5">
            <Field label="Название">
              <Input name="title" placeholder="Белый Crafter" required />
            </Field>
            <Field label="Номер">
              <Input name="plate" placeholder="Х578ОУ 98" />
            </Field>
            <Field label="Emoji">
              <Input name="emoji" placeholder="🚐" />
            </Field>
            <input type="hidden" name="isActive" value="true" />
            <div className="flex items-end">
              <Button type="submit">Создать</Button>
            </div>
          </form>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id}>
              <div className="flex justify-between gap-3">
                <div>
                  <CardTitle>
                    {vehicle.emoji || "🚐"} {vehicle.title}
                  </CardTitle>
                  <CardDescription>{vehicle.plate || "Без номера"}</CardDescription>
                </div>
                <Badge>{vehicle.isActive ? "Активна" : "Архив"}</Badge>
              </div>
              <form action={updateVehicleAction.bind(null, studio.slug, vehicle.id)} className="mt-5 grid gap-3">
                <Field label="Название">
                  <Input name="title" defaultValue={vehicle.title} required />
                </Field>
                <Field label="Номер">
                  <Input name="plate" defaultValue={vehicle.plate || ""} />
                </Field>
                <Field label="Emoji">
                  <Input name="emoji" defaultValue={vehicle.emoji || ""} />
                </Field>
                <Field label="Статус">
                  <Select name="isActive" defaultValue={String(vehicle.isActive)}>
                    <option value="true">Активна</option>
                    <option value="false">Архив</option>
                  </Select>
                </Field>
                <Button type="submit">Сохранить</Button>
              </form>
            </Card>
          ))}
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
