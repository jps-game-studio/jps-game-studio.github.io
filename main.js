const pageState = {
  loadedAt: new Date().toISOString(),
};

document.addEventListener("DOMContentLoaded", () => {
  document.body.dataset.debugReady = "true";
  document.body.dataset.loadedAt = pageState.loadedAt;
  console.debug("Race Legends page ready", pageState);
});

if (window.location.protocol.startsWith("http") && typeof window.EventSource !== "undefined") {
  const liveReload = new EventSource("/__live-reload");

  liveReload.addEventListener("reload", (event) => {
    console.debug("Race Legends live reload", event.data);
    window.location.reload();
  });

  liveReload.onerror = () => {
    console.debug("Race Legends live reload disconnected");
  };
}
