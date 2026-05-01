import { BriefcaseBusiness, Film, UserRound } from "lucide-react";
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
              <p className="text-sm uppercase tracking-[0.24em] text-primary">MSS</p>
              <h1 className="text-3xl font-semibold tracking-normal text-white sm:text-5xl">Movie Shooting Schedule</h1>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-white">
                <UserRound className="h-5 w-5" />
              </div>
              <CardTitle>Я сотрудник</CardTitle>
              <CardDescription>
                Войдите и отправьте заявку в студию по её username. Администратор подтвердит доступ.
              </CardDescription>
              <div className="mt-6">
                <YandexSignIn callbackUrl="/studios/join">Войти как сотрудник</YandexSignIn>
              </div>
            </Card>
            <Card>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
              <CardTitle>Я администратор</CardTitle>
              <CardDescription>
                Создайте студию, получите права владельца и пригласите сотрудников через username студии.
              </CardDescription>
              <div className="mt-6">
                <YandexSignIn callbackUrl="/studios/new">Войти как администратор</YandexSignIn>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
