self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function appUrlFromPayload(raw) {
  const fallback = "/workspace/dashboard";
  try {
    const parsed = new URL(raw || fallback, self.location.origin);
    return `${self.location.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return new URL(fallback, self.location.origin).href;
  }
}

self.addEventListener("push", (event) => {
  let data = {
    title: "Wraptron",
    body: "You have a new reminder.",
    url: "/workspace/dashboard",
    tag: "wraptron",
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    try {
      const text = event.data?.text();
      if (text) data.body = text;
    } catch {
      // keep defaults
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: appUrlFromPayload(data.url) },
      tag: data.tag || "wraptron",
      requireInteraction: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const absoluteUrl = appUrlFromPayload(
    event.notification.data?.url || "/workspace/dashboard",
  );

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            if ("navigate" in client) {
              return client.navigate(absoluteUrl).then((navigated) => {
                return navigated ? navigated.focus() : client.focus();
              });
            }
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(absoluteUrl);
        }
        return undefined;
      }),
  );
});
