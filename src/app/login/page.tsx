import { Film } from "lucide-react";
import { YandexSignIn } from "@/components/auth/yandex-sign-in";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="film-grid min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center">
        <div className="w-full">
          <div className="mb-8 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-white shadow-[0_0_40px_rgba(229,9,20,0.35)]">
              <Film className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-primary">production schedule</p>
              <h1 className="text-3xl font-semibold tracking-normal text-white sm:text-5xl">26 FPS Schedule</h1>
            </div>
          </div>
          <Card className="max-w-xl">
            <CardTitle>Приватный сервис расписания для съёмочных групп</CardTitle>
            <CardDescription>
              Студии, проекты, смены, машины, вызывные PDF и личный кабинет сотрудника в одном тёмном рабочем интерфейсе.
            </CardDescription>
            <div className="mt-6">
              <YandexSignIn />
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
