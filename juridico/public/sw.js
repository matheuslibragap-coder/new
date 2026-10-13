// Service worker: recebe notificações push de prazos, audiências e andamentos.
self.addEventListener("push", (event) => {
  let dados = { titulo: "Aviso", corpo: "", link: "/painel" };
  try {
    dados = event.data ? event.data.json() : dados;
  } catch {
    // payload inválido: usa o padrão
  }
  event.waitUntil(self.registration.showNotification(dados.titulo, { body: dados.corpo, icon: "/icone.svg", data: { link: dados.link } }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/painel";
  event.waitUntil(clients.openWindow(link));
});
