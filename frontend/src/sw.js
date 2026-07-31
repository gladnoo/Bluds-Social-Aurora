import { precacheAndRoute } from "workbox-precaching";

// Injetado automaticamente pelo vite-plugin-pwa no build
precacheAndRoute(self.__WB_MANIFEST);

// Recebe um push notification e mostra ele no sistema
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Bluds", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Bluds", {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/" },
    })
  );
});

// Ao clicar na notificação, abre (ou foca) o app na página certa
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
