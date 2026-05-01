"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function YandexSignIn() {
  return (
    <Button type="button" onClick={() => signIn("yandex", { callbackUrl: "/studios" })}>
      Войти через Yandex
    </Button>
  );
}
