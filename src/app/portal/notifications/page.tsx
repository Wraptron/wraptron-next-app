"use client";

import { useEffect, useState } from "react";
import { Bell, CreditCard, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PortalPage } from "@/components/portal/portal-page";
import { usePageTitle } from "@/contexts/page-title-context";
import {
  MOCK_NOTIFICATIONS,
  formatRelativeDate,
  type NotificationKind,
  type PortalNotification,
} from "@/lib/portal-data";

const KIND_ICONS: Record<NotificationKind, React.ComponentType<{ className?: string }>> = {
  build: Hammer,
  ticket: Bell,
  invoice: CreditCard,
};

export default function PortalNotificationsPage() {
  const { setTitle } = usePageTitle();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  useEffect(() => {
    setTitle("Notifications");
    return () => setTitle(null);
  }, [setTitle]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)),
    );
  };

  return (
    <PortalPage
      title="Notifications"
      description="Build updates, ticket assignments, and invoice alerts."
      actions={
        unreadCount > 0 ? (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Mark all read
          </Button>
        ) : undefined
      }
    >
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {notifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onToggle={() => toggleRead(notification.id)}
              />
            ))}
          </ul>
        </CardContent>
      </Card>
    </PortalPage>
  );
}

function NotificationRow({
  notification,
  onToggle,
}: {
  notification: PortalNotification;
  onToggle: () => void;
}) {
  const Icon = KIND_ICONS[notification.kind];

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-accent/30",
          !notification.read && "bg-primary/5",
        )}
      >
        <div
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            notification.read ? "bg-muted" : "bg-primary/10",
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4",
              notification.read ? "text-muted-foreground" : "text-primary",
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                "text-sm",
                notification.read ? "font-normal" : "font-semibold",
              )}
            >
              {notification.title}
            </p>
            {!notification.read ? (
              <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{notification.body}</p>
          <time className="text-xs text-muted-foreground mt-1 block">
            {formatRelativeDate(notification.createdAt)}
          </time>
        </div>
      </button>
    </li>
  );
}
