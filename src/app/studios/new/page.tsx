import { createStudioAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth";

export default async function NewStudioPage() {
  await requireUser();

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardTitle>Новая студия</CardTitle>
          <CardDescription>
            Создатель студии станет владельцем. По username сотрудники смогут отправлять заявки на доступ.
          </CardDescription>
          <form action={createStudioAction} className="mt-6 grid gap-4">
            <div>
              <Label htmlFor="title">Название</Label>
              <Input id="title" name="title" placeholder="Movie Unit" required />
            </div>
            <div>
              <Label htmlFor="username">Username студии</Label>
              <Input id="username" name="username" placeholder="movie-unit" required />
            </div>
            <div>
              <Label htmlFor="description">Описание</Label>
              <Textarea id="description" name="description" placeholder="Съёмочная группа, продакшен или студия" />
            </div>
            <Button type="submit">Создать студию</Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
