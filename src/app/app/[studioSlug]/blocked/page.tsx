import { AppShell } from "@/components/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireStudioStatus } from "@/lib/access";

export default async function BlockedPage({ params }: { params: Promise<{ studioSlug: string }> }) {
  const { studioSlug } = await params;
  const { studio, member } = await requireStudioStatus(studioSlug, "BLOCKED");
  return (
    <AppShell studio={studio} member={member}>
      <Card>
        <CardTitle>Доступ ограничен</CardTitle>
        <CardDescription>Доступ к этой студии ограничен. Обратитесь к администратору.</CardDescription>
      </Card>
    </AppShell>
  );
}
