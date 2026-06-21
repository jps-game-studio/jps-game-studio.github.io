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

  // Track Store and Video Clicks
  const trackEvent = (category, action, label) => {
    if (typeof gtag === "function") {
      gtag("event", action, {
        event_category: category,
        event_label: label,
      });
    }
  };

  // Google Play Click
  const storeCta = document.querySelector(".store-cta");
  if (storeCta) {
    storeCta.addEventListener("click", () => {
      trackEvent("Engagement", "click_google_play", "Store Link");
    });
  }

  // Video Clicks
  document.querySelectorAll(".video-grid .video-card").forEach((card) => {
    card.addEventListener("click", () => {
      const title =
        card.querySelector(".video-card__title")?.textContent ||
        "Unknown Video";
      const type = card.classList.contains("video-card--short")
        ? "Short"
        : "Full Video";
      trackEvent("Engagement", "view_video", `${type}: ${title}`);
    });
  });
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
