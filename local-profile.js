(() => {
  "use strict";

  const STORAGE_KEY = "dewify:local-profile:v2";
  const defaults = {
    name: "",
    email: "",
    business: "",
    phone: "",
    avatar: ""
  };

  const loadProfile = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("dewify:local-profile:v1");
      if (!raw) return { ...defaults };
      const parsed = JSON.parse(raw);
      const profile = { ...defaults, ...(parsed && typeof parsed === "object" ? parsed : {}) };
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanProfile(profile)));
      }
      return profile;
    } catch {
      return { ...defaults };
    }
  };

  const hasProfile = (profile) =>
    Boolean(
      String(profile.name || "").trim() ||
      String(profile.email || "").trim() ||
      String(profile.business || "").trim() ||
      String(profile.phone || "").trim() ||
      profile.avatar
    );

  const cleanProfile = (profile) => ({
    name: String(profile.name || "").trim().slice(0, 120),
    email: String(profile.email || "").trim().slice(0, 190),
    business: String(profile.business || "").trim().slice(0, 160),
    phone: String(profile.phone || "").trim().slice(0, 40),
    avatar: typeof profile.avatar === "string" && profile.avatar.startsWith("data:image/") ? profile.avatar : ""
  });

  const saveProfile = (profile) => {
    const cleaned = cleanProfile(profile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    return cleaned;
  };

  const displayName = (profile) =>
    String(profile.name || "").trim() ||
    String(profile.business || "").trim() ||
    String(profile.email || "").trim() ||
    "Your profile";

  const initials = (profile) => {
    const source = displayName(profile).replace(/\s+/g, " ").trim();
    const parts = source.split(" ").filter(Boolean);
    return (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : source.slice(0, 2))
      .toUpperCase();
  };

  const renderAvatar = (element, profile, large = false) => {
    if (!element) return;
    element.classList.toggle("has-image", Boolean(profile.avatar));
    element.innerHTML = profile.avatar
      ? '<img src="' + profile.avatar.replace(/"/g, "&quot;") + '" alt="">'
      : '<span>' + initials(profile) + '</span>';
    element.setAttribute("aria-label", displayName(profile) + " profile");
    element.classList.toggle("is-large", large);
  };

  const resizeImage = (file) =>
    new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) {
        reject(new Error("invalid_image"));
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("read_failed"));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error("image_failed"));
        image.onload = () => {
          const max = 320;
          const scale = Math.min(1, max / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
          const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
          const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("canvas_unavailable"));
            return;
          }
          ctx.drawImage(image, 0, 0, width, height);
          let data = "";
          try {
            data = canvas.toDataURL("image/webp", 0.82);
          } catch {
            data = "";
          }
          if (!data || data === "data:image/webp") {
            data = canvas.toDataURL("image/jpeg", 0.82);
          }
          resolve(data);
        };
        image.src = String(reader.result || "");
      };
      reader.readAsDataURL(file);
    });

  const ready = () => {
    if (!document.body || document.getElementById("dewify-local-profile-panel")) return;

    let profile = loadProfile();

    const nav = document.querySelector(".nav");
    const existingPill = nav?.querySelector(".store-pill");

    const trigger = document.createElement("button");
    trigger.id = "dewify-local-profile-trigger";
    trigger.type = "button";
    trigger.className = "dewify-local-profile-nav";
    trigger.setAttribute("aria-controls", "dewify-local-profile-panel");
    trigger.setAttribute("aria-expanded", "false");
    trigger.innerHTML = `
      <span class="dewify-profile-nav-copy">
        <small>LOCAL PROFILE</small>
        <strong>View profile</strong>
      </span>
      <span class="dewify-profile-avatar dewify-profile-avatar-nav"></span>
    `;

    if (existingPill) existingPill.replaceWith(trigger);
    else nav?.appendChild(trigger);

    const backdrop = document.createElement("div");
    backdrop.id = "dewify-local-profile-backdrop";

    const panel = document.createElement("aside");
    panel.id = "dewify-local-profile-panel";
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML = `
      <div class="dewify-local-profile-head">
        <div>
          <p class="dewify-local-profile-kicker">DEWIFY / BROWSER PROFILE</p>
          <h2 class="dewify-local-profile-title">Your profile</h2>
        </div>
        <button class="dewify-local-profile-close" type="button" aria-label="Close profile">×</button>
      </div>

      <div class="dewify-local-profile-body">
        <section class="dewify-profile-view" aria-label="Saved profile">
          <div class="dewify-profile-hero">
            <div class="dewify-profile-avatar dewify-profile-avatar-large" data-profile-avatar></div>
            <div>
              <p class="dewify-profile-active"><i></i> LOCAL PROFILE ACTIVE</p>
              <h3 data-profile-name>Your profile</h3>
              <p data-profile-subtitle>Saved in this browser on this device.</p>
            </div>
          </div>

          <div class="dewify-profile-details">
            <div><span>NAME</span><strong data-profile-field="name">Not set</strong></div>
            <div><span>EMAIL</span><strong data-profile-field="email">Not set</strong></div>
            <div><span>BUSINESS / BRAND</span><strong data-profile-field="business">Not set</strong></div>
            <div><span>PHONE</span><strong data-profile-field="phone">Not set</strong></div>
          </div>

          <div class="dewify-local-profile-view-actions">
            <button class="dewify-local-profile-edit" type="button">Edit profile</button>
            <button class="dewify-local-profile-clear" type="button">Clear local info</button>
          </div>

          <p class="dewify-local-profile-note">No login is required. Profile information is stored locally in this browser and is not used as server-side authentication.</p>
          <p class="dewify-local-profile-warning">Do not enter payment card details, passwords, or other secrets here. Clearing this site's browser data can remove the profile.</p>
        </section>

        <form class="dewify-local-profile-form" hidden>
          <div class="dewify-profile-edit-hero">
            <div class="dewify-profile-avatar dewify-profile-avatar-large" data-edit-avatar></div>
            <div>
              <p class="dewify-local-profile-kicker">EDIT PROFILE</p>
              <strong>Saved only on this browser</strong>
            </div>
          </div>

          <label class="dewify-avatar-picker">
            <span>Profile picture</span>
            <input name="avatar" type="file" accept="image/*">
            <em>Choose an image</em>
          </label>
          <button class="dewify-avatar-remove" type="button">Remove picture</button>

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
            <button class="dewify-local-profile-save" type="submit">Save profile</button>
            <button class="dewify-local-profile-cancel" type="button">Cancel</button>
          </div>
          <p class="dewify-local-profile-status" role="status" aria-live="polite"></p>
        </form>
      </div>
    `;

    document.body.append(backdrop, panel);

    const view = panel.querySelector(".dewify-profile-view");
    const form = panel.querySelector(".dewify-local-profile-form");
    const status = panel.querySelector(".dewify-local-profile-status");
    const close = panel.querySelector(".dewify-local-profile-close");
    const edit = panel.querySelector(".dewify-local-profile-edit");
    const cancel = panel.querySelector(".dewify-local-profile-cancel");
    const clear = panel.querySelector(".dewify-local-profile-clear");
    const avatarInput = panel.querySelector('input[name="avatar"]');
    const avatarRemove = panel.querySelector(".dewify-avatar-remove");
    const fields = {
      name: panel.querySelector("#dewify-profile-name"),
      email: panel.querySelector("#dewify-profile-email"),
      business: panel.querySelector("#dewify-profile-business"),
      phone: panel.querySelector("#dewify-profile-phone")
    };

    const navAvatar = trigger.querySelector(".dewify-profile-avatar-nav");
    const viewAvatar = panel.querySelector("[data-profile-avatar]");
    const editAvatar = panel.querySelector("[data-edit-avatar]");

    const fillForm = () => {
      Object.entries(fields).forEach(([key, input]) => { input.value = profile[key] || ""; });
      renderAvatar(editAvatar, profile, true);
      avatarRemove.hidden = !profile.avatar;
    };

    const renderView = () => {
      renderAvatar(navAvatar, profile);
      renderAvatar(viewAvatar, profile, true);
      trigger.querySelector(".dewify-profile-nav-copy strong").textContent = "View profile";
      trigger.title = hasProfile(profile)
        ? "Your profile is saved in this browser"
        : "No profile saved yet";

      const name = panel.querySelector("[data-profile-name]");
      const subtitle = panel.querySelector("[data-profile-subtitle]");
      if (name) name.textContent = displayName(profile);
      if (subtitle) subtitle.textContent = hasProfile(profile)
        ? "Saved in this browser on this device."
        : "Create a local profile for this browser.";

      panel.querySelectorAll("[data-profile-field]").forEach((el) => {
        const key = el.dataset.profileField;
        el.textContent = profile[key] || "Not set";
      });
    };

    const setEditMode = (enabled) => {
      view.hidden = enabled;
      form.hidden = !enabled;
      if (enabled) {
        fillForm();
        window.setTimeout(() => fields.name.focus(), 20);
      }
    };

    const open = () => {
      renderView();
      setEditMode(false);
      panel.classList.add("is-open");
      backdrop.classList.add("is-open");
      panel.setAttribute("aria-hidden", "false");
      trigger.setAttribute("aria-expanded", "true");
    };

    const hide = () => {
      panel.classList.remove("is-open");
      backdrop.classList.remove("is-open");
      panel.setAttribute("aria-hidden", "true");
      trigger.setAttribute("aria-expanded", "false");
    };

    trigger.addEventListener("click", open);
    close.addEventListener("click", hide);
    backdrop.addEventListener("click", hide);
    edit.addEventListener("click", () => setEditMode(true));
    cancel.addEventListener("click", () => {
      status.textContent = "";
      setEditMode(false);
    });

    avatarInput.addEventListener("change", async () => {
      const file = avatarInput.files?.[0];
      if (!file) return;
      status.textContent = "Processing profile picture…";
      try {
        profile = { ...profile, avatar: await resizeImage(file) };
        renderAvatar(editAvatar, profile, true);
        avatarRemove.hidden = !profile.avatar;
        status.textContent = "Picture ready. Save the profile to keep it.";
      } catch {
        status.textContent = "That image could not be used.";
        avatarInput.value = "";
      }
    });

    avatarRemove.addEventListener("click", () => {
      profile = { ...profile, avatar: "" };
      avatarInput.value = "";
      renderAvatar(editAvatar, profile, true);
      avatarRemove.hidden = true;
      status.textContent = "Picture removed. Save the profile to apply it.";
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      try {
        profile = saveProfile({
          ...profile,
          name: fields.name.value,
          email: fields.email.value,
          business: fields.business.value,
          phone: fields.phone.value
        });
        status.textContent = "Profile saved locally in this browser.";
        renderView();
        window.setTimeout(() => setEditMode(false), 450);
      } catch {
        status.textContent = "This browser blocked local profile storage.";
      }
    });

    clear.addEventListener("click", () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
        profile = { ...defaults };
        renderView();
        setEditMode(false);
        status.textContent = "";
      } catch {
        status.textContent = "Could not clear local profile storage.";
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && panel.classList.contains("is-open")) hide();
    });

    renderView();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready, { once: true });
  } else {
    ready();
  }
})();
