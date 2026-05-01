import { AppShell } from "@/components/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireStudioStatus } from "@/lib/access";

export default async function PendingPage({ params }: { params: Promise<{ studioSlug: string }> }) {
  const { studioSlug } = await params;
  const { studio, member } = await requireStudioStatus(studioSlug, "PENDING");
  return (
    <AppShell studio={studio} member={member}>
      <Card>
        <CardTitle>Заявка отправлена</CardTitle>
        <CardDescription>
          Администратор студии должен подтвердить доступ. После подтверждения здесь появится ваше расписание.
        </CardDescription>
      </Card>
    </AppShell>
  );
}
