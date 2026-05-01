"use client";

import { Bell } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function NotificationSettings({ vapidPublicKey }: { vapidPublicKey?: string }) {
  const [message, setMessage] = useState("Уведомления готовы к подключению в браузере.");

  async function subscribe() {
    if (!vapidPublicKey || vapidPublicKey === "replace-me") {
      setMessage("VAPID ключи не настроены на сервере.");
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setMessage("Этот браузер не поддерживает web push.");
      return;
    }
    setMessage("Регистрация service worker будет добавлена следующим шагом.");
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <Bell className="h-4 w-4 text-primary" />
          Уведомления
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
      <Button type="button" variant="secondary" size="sm" onClick={subscribe}>
        Включить
      </Button>
    </div>
  );
}
