const pageState = {
  loadedAt: new Date().toISOString(),
};

document.addEventListener("DOMContentLoaded", () => {
  document.body.dataset.debugReady = "true";
  document.body.dataset.loadedAt = pageState.loadedAt;
  console.debug("Race Legends page ready", pageState);

  // Cookie Banner Logic
  const banner = document.getElementById("cookie-banner");
  const acceptBtn = document.getElementById("cookie-accept");
  const rejectBtn = document.getElementById("cookie-reject");

  if (banner && !localStorage.getItem("cookieConsent")) {
    banner.style.display = "block";
  }

  const setConsent = (granted) => {
    const consent = {
      analytics_storage: granted ? "granted" : "denied",
      ad_storage: granted ? "granted" : "denied",
      ad_user_data: granted ? "granted" : "denied",
      ad_personalization: granted ? "granted" : "denied",
    };
    localStorage.setItem("cookieConsent", JSON.stringify(consent));
    if (typeof gtag === "function") {
      gtag("consent", "update", consent);
    }
    banner.style.display = "none";
  };

  if (acceptBtn) acceptBtn.onclick = () => setConsent(true);
  if (rejectBtn) rejectBtn.onclick = () => setConsent(false);
});

if (
  window.location.protocol.startsWith("http") &&
  typeof window.EventSource !== "undefined"
) {
  const liveReload = new EventSource("/__live-reload");

  liveReload.addEventListener("reload", (event) => {
    console.debug("Race Legends live reload", event.data);
    window.location.reload();
  });

  liveReload.onerror = () => {
    console.debug("Race Legends live reload disconnected");
  };
}
