(() => {
  "use strict";

  const cfg = window.DEWIFY_CONFIG || {};
  const product = cfg.notionTemplates?.sellerDashboard;
  const action = document.getElementById("sellerPrimaryAction");
  const price = document.getElementById("sellerReleasePrice");
  const status = document.getElementById("sellerCheckoutStatus");

  const setStatus = (message) => {
    if (status) status.textContent = message;
  };

  const showDeliveryLink = (label) => {
    if (!action || !product?.notionUrl) return;
    const link = document.createElement("a");
    link.id = "sellerPrimaryAction";
    link.className = "nt-button nt-button-dark";
    link.href = product.notionUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;
    action.replaceWith(link);
  };

  const loadPaddle = () => new Promise((resolve, reject) => {
    if (window.Paddle) return resolve(window.Paddle);
    const existing = document.querySelector('script[data-dewify-paddle]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Paddle), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.dataset.dewifyPaddle = "true";
    script.onload = () => window.Paddle ? resolve(window.Paddle) : reject(new Error("Paddle did not initialize."));
    script.onerror = () => reject(new Error("Paddle checkout could not load."));
    document.head.appendChild(script);
  });

  async function initPaidCheckout() {
    const token = String(cfg.PADDLE_CLIENT_TOKEN || "").trim();
    const priceId = String(product?.priceId || "").trim();

    if (!token || !priceId) {
      if (action) {
        action.disabled = true;
        action.textContent = "Checkout not configured";
      }
      setStatus("To enable the paid release, add the Paddle client-side token and this product's Price ID in config.js. Do not put a Paddle API secret in frontend files.");
      return;
    }

    if (action) {
      action.disabled = true;
      action.textContent = "Preparing checkout…";
    }
    setStatus("Connecting to Paddle…");

    try {
      const Paddle = await loadPaddle();
      if (String(cfg.PADDLE_ENVIRONMENT || "production").toLowerCase() === "sandbox") {
        Paddle.Environment.set("sandbox");
      }

      let checkoutOpen = false;
      Paddle.Initialize({
        token,
        eventCallback: (event) => {
          if (event?.name === "checkout.completed") {
            checkoutOpen = false;
            const method = String(
              event?.data?.payment?.method_details?.type ||
              event?.data?.payment?.method_details?.kebab_type ||
              ""
            ).toLowerCase();
            const paymentStatus = String(event?.data?.status || "").toLowerCase();

            if (method === "upi" && !["paid", "completed"].includes(paymentStatus)) {
              setStatus("Payment submitted. Waiting for Paddle to confirm completion.");
              return;
            }

            setStatus("Paddle reported checkout completion in this browser. Continue to the Notion template.");
            showDeliveryLink("Continue to Notion template ↗");
            return;
          }

          if (event?.name === "checkout.payment.failed" || event?.name === "checkout.payment.error") {
            checkoutOpen = false;
            setStatus("Payment was not completed. You can try checkout again.");
            if (action) action.disabled = false;
            return;
          }

          if (event?.name === "checkout.closed") {
            checkoutOpen = false;
            setStatus("Checkout closed. You can reopen it when ready.");
          }

          if (event?.name === "checkout.error" || event?.name === "checkout.warning") {
            checkoutOpen = false;
            setStatus("Paddle could not complete checkout: " + (event?.detail || event?.code || "unknown error"));
            if (action) action.disabled = false;
          }
        }
      });

      if (action) {
        action.disabled = false;
        action.textContent = "Buy template ↗";
        action.addEventListener("click", () => {
          if (checkoutOpen) return;
          try {
            checkoutOpen = true;
            setStatus("Opening Paddle checkout…");
            Paddle.Checkout.open({
              items: [{ priceId, quantity: 1 }],
              settings: { displayMode: "overlay", theme: "light", locale: "en" }
            });
          } catch (error) {
            checkoutOpen = false;
            setStatus("Checkout error: " + (error?.message || "open_failed"));
          }
        });
      }

      try {
        const preview = await Paddle.PricePreview({ items: [{ priceId, quantity: 1 }] });
        const line = preview?.data?.details?.lineItems?.[0];
        const localized = line?.formattedTotals?.total ||
          line?.formattedUnitTotals?.total ||
          line?.formattedTotals?.subtotal ||
          line?.formattedUnitTotals?.subtotal;
        if (localized && price) price.textContent = localized;
      } catch (_) {
        // Paddle will show the final amount, tax and currency in checkout.
      }

      setStatus("Paddle checkout is ready.");
    } catch (error) {
      if (action) {
        action.disabled = true;
        action.textContent = "Checkout unavailable";
      }
      setStatus(error?.message || "Paddle checkout could not initialize.");
    }
  }

  if (!product || !product.notionUrl) {
    if (action) {
      action.disabled = true;
      action.textContent = "Template link unavailable";
    }
    if (price) price.textContent = "Unavailable";
    setStatus("The Notion delivery link is not configured.");
    return;
  }

  const mode = String(product.releaseMode || "free").toLowerCase();
  if (mode === "free") {
    if (price) price.textContent = product.displayPrice || "Free during testing";
    showDeliveryLink("Open free template in Notion ↗");
    setStatus("Free testing access. No payment is required.");
    return;
  }

  if (mode === "paid") {
    if (price) price.textContent = product.displayPrice || "Price shown at checkout";
    initPaidCheckout();
    return;
  }

  if (action) {
    action.disabled = true;
    action.textContent = "Unavailable";
  }
  setStatus("This product is not currently released.");
})();