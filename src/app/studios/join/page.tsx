import { joinStudioAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireUser } from "@/lib/auth";

export default async function JoinStudioPage() {
  await requireUser();
  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardTitle>Запрос доступа к студии</CardTitle>
          <CardDescription>
            Введите username студии. Администратор увидит заявку и подтвердит доступ внутри этой студии.
          </CardDescription>
          <form action={joinStudioAction} className="mt-6 grid gap-4">
            <div>
              <Label htmlFor="username">Username студии</Label>
              <Input id="username" name="username" placeholder="movie-unit" required />
            </div>
            <Button type="submit">Отправить заявку</Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
