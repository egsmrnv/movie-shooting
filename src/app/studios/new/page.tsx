import { createStudioAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth";
import { canCreateStudios } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function NewStudioPage() {
  const user = await requireUser();
  const canCreate =
    canCreateStudios() ||
    ((await prisma.studio.count()) === 0 && process.env.OWNER_EMAIL?.toLowerCase() === user.email.toLowerCase());

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardTitle>Новая студия</CardTitle>
          <CardDescription>
            Создатель студии станет владельцем этой студии. Доступ к другим студиям от этого не меняется.
          </CardDescription>
          {canCreate ? (
            <form action={createStudioAction} className="mt-6 grid gap-4">
              <div>
                <Label htmlFor="title">Название</Label>
                <Input id="title" name="title" placeholder="26 FPS" required />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" placeholder="26-fps" required />
              </div>
              <div>
                <Label htmlFor="description">Описание</Label>
                <Textarea id="description" name="description" placeholder="Команда камервагенов и плейбека" />
              </div>
              <Button type="submit">Создать студию</Button>
            </form>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">Создание студий отключено на этом сервере.</p>
          )}
        </Card>
      </div>
    </main>
  );
}
