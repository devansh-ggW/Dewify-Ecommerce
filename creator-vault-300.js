(() => {
  "use strict";

  const cfg = window.DEWIFY_CONFIG || {};
  const product = (cfg.products || []).find(p => p.id === "creator-vault-300");
  const $ = selector => document.querySelector(selector);
  const token = String(cfg.PADDLE_CLIENT_TOKEN || "").trim();
  const priceId = String(product?.priceId || "").trim();

  let paddleReady = false;
  let checkoutOpen = false;
  const storageKey = "dewify:download-ready:creator-vault-300";

  function setStatus(message) {
    const el = $("#checkoutStatus");
    if (el) {
      el.textContent = message;
      el.setAttribute("aria-live", "polite");
    }
  }

  function setPrice(value) {
    const el = $("#productPrice");
    if (el && value) el.textContent = value;
  }

  function setDownloadLink() {
    if (!product?.downloadUrl) return;

    ["#downloadVault", "#downloadPersistent"].forEach(selector => {
      const link = $(selector);
      if (!link) return;
      link.href = product.downloadUrl;
      link.removeAttribute("aria-disabled");
      link.dataset.ready = "true";
    });
  }

  function rememberDownload(transactionId) {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({
        transactionId: transactionId || "Completed",
        ready: true
      }));
    } catch (error) {
      console.warn("Could not remember download state:", error);
    }
  }

  function showDownloadBar() {
    const bar = $("#downloadBar");
    const link = $("#downloadPersistent");
    if (!bar || !link || !product?.downloadUrl) return;
    setDownloadLink();
    bar.hidden = false;
    link.setAttribute("aria-disabled", "false");
  }

  function restoreDownload() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
      if (saved?.ready) showDownloadBar();
    } catch (error) {
      console.warn("Could not restore download state:", error);
    }
  }

  function setBuyState(ready) {
    const button = $("#buyButton");
    if (!button) return;
    button.disabled = !ready;
    button.setAttribute("aria-disabled", String(!ready));
    button.textContent = ready ? "Buy CREATOR VAULT 300 ↗" : "Preparing checkout…";
    button.classList.toggle("is-loading", !ready);
  }

  function showSuccess(event) {
    const modal = $("#successModal");
    if (!modal) return;

    const tx = $("#successTransaction");
    if (tx) tx.textContent = event?.data?.transaction_id || "Completed";

    const transactionId = event?.data?.transaction_id || "Completed";
    rememberDownload(transactionId);
    setDownloadLink();
    showDownloadBar();

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("locked");

    const download = $("#downloadVault");
    window.setTimeout(() => download?.focus(), 40);
  }

  function closeSuccess() {
    const modal = $("#successModal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("locked");
  }

  async function initPaddle() {
    setBuyState(false);
    setStatus("Loading local price & secure checkout…");

    if (!window.Paddle) {
      setStatus("Paddle checkout could not load. Please refresh and try again.");
      return;
    }

    if (!token || !priceId) {
      setStatus("Checkout setup is incomplete. Please contact support.");
      return;
    }

    try {
      if (String(cfg.PADDLE_ENVIRONMENT || "production").toLowerCase() === "sandbox") {
        Paddle.Environment.set("sandbox");
      }

      Paddle.Initialize({
        token,
        eventCallback: event => {
          if (event?.name === "checkout.completed") {
            checkoutOpen = false;
            showSuccess(event);
            return;
          }

          if (event?.name === "checkout.closed") {
            checkoutOpen = false;
          }

          if (
            event?.name === "checkout.error" ||
            event?.name === "checkout.payment.error" ||
            event?.name === "checkout.warning"
          ) {
            checkoutOpen = false;
            console.error("Paddle checkout event:", event);
            setStatus(
              "Paddle: " +
                (event?.detail || event?.code || "Checkout could not complete.")
            );
            setBuyState(true);
          }
        }
      });

      paddleReady = true;
      setBuyState(true);

      try {
        const result = await Paddle.PricePreview({
          items: [{ priceId, quantity: 1 }]
        });

        const line = result?.data?.details?.lineItems?.[0];
        const localized =
          line?.formattedTotals?.total ||
          line?.formattedUnitTotals?.total ||
          line?.formattedTotals?.subtotal ||
          line?.formattedUnitTotals?.subtotal;

        if (localized) {
          setPrice(localized);
          setStatus("Local price loaded. Checkout is ready.");
        } else {
          setStatus("Checkout is ready. Final total is confirmed in Paddle.");
        }
      } catch (error) {
        console.warn("Price preview failed:", error);
        setStatus("Checkout is ready. Final tax and currency are confirmed in Paddle.");
      }
    } catch (error) {
      console.error("Paddle initialization failed:", error);
      setStatus("Checkout error: " + (error?.message || "initialize_failed"));
    }
  }

  $("#buyButton")?.addEventListener("click", () => {
    if (!paddleReady || !window.Paddle) {
      setStatus("Checkout is still loading. Please try again in a moment.");
      return;
    }

    if (!priceId) {
      setStatus("Checkout setup is incomplete. Please contact support.");
      return;
    }

    if (checkoutOpen) return;

    try {
      checkoutOpen = true;
      setStatus("Opening secure checkout…");

      Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        settings: {
          displayMode: "overlay",
          theme: "light",
          locale: "en"
        }
      });
    } catch (error) {
      checkoutOpen = false;
      console.error("Paddle checkout failed:", error);
      setStatus("Checkout error: " + (error?.message || "open_failed"));
    }
  });

  $("#downloadVault, #downloadPersistent")?.addEventListener("click", event => {
    const link = event.currentTarget;
    if (!link?.dataset?.ready || link.getAttribute("href") === "#") {
      event.preventDefault();
      setStatus("Your download is still being prepared. Please close and reopen the confirmation.");
    }
  });

  $("#closeSuccess")?.addEventListener("click", closeSuccess);
  $("#successModal .scrim")?.addEventListener("click", closeSuccess);
  window.addEventListener("keydown", event => {
    if (event.key === "Escape") closeSuccess();
  });

  restoreDownload();
  window.addEventListener("load", initPaddle, { once: true });
})();