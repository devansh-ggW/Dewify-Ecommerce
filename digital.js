(() => {
  "use strict";

  const cfg = window.DEWIFY_CONFIG || {};
  const product = (cfg.products || []).find(p => p.id === "ai-money-arc");
  const $ = (selector) => document.querySelector(selector);
  const token = String(cfg.PADDLE_CLIENT_TOKEN || "").trim();
  const priceId = String(product?.priceId || "").trim();

  const setStatus = (message) => {
    const el = $("#checkoutStatus");
    if (el) el.textContent = message;
  };

  const setDownloadLinks = () => {
    const book = $("#downloadBook");
    if (book && product?.downloadUrl) book.href = product.downloadUrl;
  };

  const setLocalizedPrice = async () => {
    if (!window.Paddle || !priceId) return;

    try {
      const result = await Paddle.PricePreview({
        items: [{ priceId, quantity: 1 }]
      });
      const line = result?.data?.details?.lineItems?.[0];
      const localized = line?.formattedTotals?.subtotal || line?.formattedUnitTotals?.subtotal;
      if (localized) {
        const price = $("#productPrice");
        if (price) price.textContent = localized;
      }
    } catch (error) {
      console.warn("Localized price preview failed:", error);
    }
  };

  const closeSuccess = () => {
    const modal = $("#successModal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("locked");
  };

  if (product) {
    const price = $("#productPrice");
    const name = $("#productName");
    if (price) price.textContent = product.displayPrice || "$9.99";
    if (name) name.textContent = product.name;
  }

  async function init() {
    if (!window.Paddle) {
      setStatus("Paddle checkout could not load. Please refresh and try again.");
      return;
    }

    if (!token || !priceId) {
      setStatus("Checkout setup is incomplete.");
      return;
    }

    try {
      if (String(cfg.PADDLE_ENVIRONMENT || "production").toLowerCase() === "sandbox") {
        Paddle.Environment.set("sandbox");
      }

      Paddle.Initialize({
        token,
        eventCallback: (event) => {
          if (
            event?.name === "checkout.error" ||
            event?.name === "checkout.payment.error" ||
            event?.name === "checkout.warning"
          ) {
            const code = event?.code || "unknown_error";
            const detail = event?.detail || "Paddle could not complete this checkout.";
            console.error("Paddle checkout event:", event);
            setStatus(`Paddle: ${code} — ${detail}`);
          }

          if (event?.name === "checkout.completed") {
            const out = $("#successTransaction");
            if (out) out.textContent = event.data?.transaction_id || "Completed";

            const modal = $("#successModal");
            if (modal) {
              setDownloadLinks();
              modal.classList.add("is-open");
              modal.setAttribute("aria-hidden", "false");
              document.body.classList.add("locked");
            }
          }
        }
      });

      await setLocalizedPrice();
      setStatus("Secure checkout is ready.");
    } catch (error) {
      console.error("Paddle.Initialize failed:", error);
      setStatus(`Checkout error: ${error?.message || "initialize_failed"}`);
    }
  }

  window.addEventListener("load", init, { once: true });

  $("#buyButton")?.addEventListener("click", () => {
    if (!window.Paddle) {
      setStatus("Paddle checkout is still loading. Please try again.");
      return;
    }

    if (!token || !priceId) {
      setStatus("Checkout setup is incomplete.");
      return;
    }

    try {
      Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        settings: {
          displayMode: "overlay",
          theme: "light"
        }
      });
    } catch (error) {
      console.error("Paddle.Checkout.open failed:", error);
      setStatus(`Checkout error: ${error?.message || "open_failed"}`);
    }
  });

  $("#closeSuccess")?.addEventListener("click", closeSuccess);
  $("#successModal .scrim")?.addEventListener("click", closeSuccess);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSuccess();
  });
})();