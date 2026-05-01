"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function YandexSignIn({
  callbackUrl = "/studios",
  children = "Войти через Yandex"
}: {
  callbackUrl?: string;
  children?: React.ReactNode;
}) {
  return (
    <Button type="button" onClick={() => signIn("yandex", { callbackUrl })}>
      {children}
    </Button>
  );
}
