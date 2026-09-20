(() => {
  "use strict";

  const cfg = window.DEWIFY_CONFIG || {};
  const product = (cfg.products || []).find(p => p.id === "creator-vault-300");
  const $ = selector => document.querySelector(selector);
  const token = String(cfg.PADDLE_CLIENT_TOKEN || "").trim();

  function setStatus(message) {
    const el = $("#checkoutStatus");
    if (el) el.textContent = message;
  }

  function setPrice(value) {
    const el = $("#productPrice");
    if (el) el.textContent = value;
  }

  function initPaddle() {
    if (!window.Paddle || !token) {
      setStatus("Secure checkout is loading.");
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
            const modal = $("#successModal");
            const tx = $("#successTransaction");
            if (tx) tx.textContent = event.data?.transaction_id || "Completed";
            if (modal) {
              modal.classList.add("is-open");
              modal.setAttribute("aria-hidden", "false");
              document.body.classList.add("locked");
            }
          }

          if (
            event?.name === "checkout.error" ||
            event?.name === "checkout.payment.error" ||
            event?.name === "checkout.warning"
          ) {
            setStatus("Paddle: " + (event?.detail || event?.code || "Checkout could not complete."));
          }
        }
      });

      const priceId = String(product?.priceId || "").trim();

      if (!priceId) {
        setStatus("Paddle price setup is pending. The listed base price is $9.99.");
        return;
      }

      Paddle.PricePreview({
        items: [{ priceId, quantity: 1 }]
      }).then(result => {
        const line = result?.data?.details?.lineItems?.[0];
        const localized = line?.formattedTotals?.subtotal || line?.formattedUnitTotals?.subtotal;
        if (localized) setPrice(localized);
        setStatus("Secure checkout is ready.");
      }).catch(error => {
        console.warn("Price preview failed:", error);
        setStatus("Secure checkout is ready.");
      });

    } catch (error) {
      console.error("Paddle initialization failed:", error);
      setStatus("Checkout setup is pending.");
    }
  }

  function openCheckout() {
    const priceId = String(product?.priceId || "").trim();

    if (!priceId) {
      setStatus("Add the CREATOR VAULT 300 Paddle price ID to enable checkout.");
      return;
    }

    if (!window.Paddle) {
      setStatus("Paddle checkout is still loading.");
      return;
    }

    try {
      Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        settings: {
          displayMode: "overlay",
          theme: "light",
          locale: "en"
        }
      });
    } catch (error) {
      console.error("Paddle checkout failed:", error);
      setStatus("Checkout could not be opened.");
    }
  }

  function closeSuccess() {
    const modal = $("#successModal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("locked");
  }

  $("#buyButton")?.addEventListener("click", openCheckout);
  $("#closeSuccess")?.addEventListener("click", closeSuccess);
  $("#successModal .scrim")?.addEventListener("click", closeSuccess);

  initPaddle();
})();