(() => {
  "use strict";

  const STORAGE_KEY = "dewify:local-profile:v1";
  const defaults = {
    name: "",
    email: "",
    business: "",
    phone: ""
  };

  const loadProfile = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...defaults };
      const parsed = JSON.parse(raw);
      return { ...defaults, ...(parsed && typeof parsed === "object" ? parsed : {}) };
    } catch {
      return { ...defaults };
    }
  };

  const saveProfile = (profile) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      name: String(profile.name || "").trim(),
      email: String(profile.email || "").trim(),
      business: String(profile.business || "").trim(),
      phone: String(profile.phone || "").trim()
    }));
  };

  const ready = () => {
    if (!document.body || document.getElementById("dewify-local-profile-trigger")) return;

    const profile = loadProfile();

    const trigger = document.createElement("button");
    trigger.id = "dewify-local-profile-trigger";
    trigger.type = "button";
    trigger.textContent = profile.name ? "Your profile" : "Local profile";
    trigger.setAttribute("aria-controls", "dewify-local-profile-panel");
    trigger.setAttribute("aria-expanded", "false");

    const backdrop = document.createElement("div");
    backdrop.id = "dewify-local-profile-backdrop";

    const panel = document.createElement("aside");
    panel.id = "dewify-local-profile-panel";
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML = `
      <div class="dewify-local-profile-head">
        <div>
          <p class="dewify-local-profile-kicker">DEWIFY / BROWSER PROFILE</p>
          <h2 class="dewify-local-profile-title">No login required.</h2>
        </div>
        <button class="dewify-local-profile-close" type="button" aria-label="Close profile">×</button>
      </div>
      <div class="dewify-local-profile-body">
        <p class="dewify-local-profile-note">Your information is stored locally in this browser on this device. It is not sent to DEWIFY by this profile feature.</p>
        <form class="dewify-local-profile-form">
          <div class="dewify-local-profile-field">
            <label for="dewify-profile-name">Name</label>
            <input id="dewify-profile-name" name="name" type="text" autocomplete="name" maxlength="120">
          </div>
          <div class="dewify-local-profile-field">
            <label for="dewify-profile-email">Email</label>
            <input id="dewify-profile-email" name="email" type="email" autocomplete="email" maxlength="190">
          </div>
          <div class="dewify-local-profile-field">
            <label for="dewify-profile-business">Business / brand</label>
            <input id="dewify-profile-business" name="business" type="text" autocomplete="organization" maxlength="160">
          </div>
          <div class="dewify-local-profile-field">
            <label for="dewify-profile-phone">Phone</label>
            <input id="dewify-profile-phone" name="phone" type="tel" autocomplete="tel" maxlength="40">
          </div>
          <div class="dewify-local-profile-actions">
            <button class="dewify-local-profile-save" type="submit">Save on this browser</button>
            <button class="dewify-local-profile-clear" type="button">Clear local info</button>
          </div>
          <p class="dewify-local-profile-status" role="status" aria-live="polite"></p>
          <p class="dewify-local-profile-warning">Do not enter payment card details, passwords, or other secrets here. Clearing this site's browser data can remove this information.</p>
        </form>
      </div>
    `;

    document.body.append(trigger, backdrop, panel);

    const form = panel.querySelector("form");
    const status = panel.querySelector(".dewify-local-profile-status");
    const close = panel.querySelector(".dewify-local-profile-close");
    const clear = panel.querySelector(".dewify-local-profile-clear");
    const fields = {
      name: panel.querySelector("#dewify-profile-name"),
      email: panel.querySelector("#dewify-profile-email"),
      business: panel.querySelector("#dewify-profile-business"),
      phone: panel.querySelector("#dewify-profile-phone")
    };

    const fill = (data) => {
      Object.entries(fields).forEach(([key, input]) => { input.value = data[key] || ""; });
    };

    fill(profile);

    const open = () => {
      panel.classList.add("is-open");
      backdrop.classList.add("is-open");
      panel.setAttribute("aria-hidden", "false");
      trigger.setAttribute("aria-expanded", "true");
      fields.name.focus();
    };

    const hide = () => {
      panel.classList.remove("is-open");
      backdrop.classList.remove("is-open");
      panel.setAttribute("aria-hidden", "true");
      trigger.setAttribute("aria-expanded", "false");
      trigger.focus();
    };

    trigger.addEventListener("click", open);
    close.addEventListener("click", hide);
    backdrop.addEventListener("click", hide);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && panel.classList.contains("is-open")) hide();
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const next = Object.fromEntries(Object.entries(fields).map(([key, input]) => [key, input.value]));
      try {
        saveProfile(next);
        trigger.textContent = next.name.trim() ? "Your profile" : "Local profile";
        status.textContent = "Saved locally in this browser.";
      } catch {
        status.textContent = "This browser blocked local storage.";
      }
    });

    clear.addEventListener("click", () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
        fill(defaults);
        trigger.textContent = "Local profile";
        status.textContent = "Local profile cleared.";
      } catch {
        status.textContent = "Could not clear local storage.";
      }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready, { once: true });
  } else {
    ready();
  }
})();
