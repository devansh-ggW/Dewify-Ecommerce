(() => {
  "use strict";
  const cfg = window.DEWIFY_CONFIG || {};
  const product = (cfg.products || []).find(p => p.id === "ai-money-arc");
  const $ = (s) => document.querySelector(s);
  const token = String(cfg.PADDLE_CLIENT_TOKEN || "").trim();
  const priceId = String(product?.priceId || "").trim();

  if (product) {
    $("#productPrice").textContent = product.displayPrice || "View price at checkout";
    $("#productName").textContent = product.name;
  }

  const setStatus = (message) => {
    const el = $("#checkoutStatus");
    if (el) el.textContent = message;
  };

  const closeSuccess = () => {
    const modal = $("#successModal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("locked");
  };

  if (window.Paddle && token && priceId) {
    try {
      if (String(cfg.PADDLE_ENVIRONMENT || "production").toLowerCase() === "sandbox") {
        Paddle.Environment.set("sandbox");
      }

      Paddle.Initialize({
        token,
        eventCallback: (event) => {
          if (event?.name === "checkout.completed") {
            const id = event.data?.transaction_id || "Completed";
            const out = $("#successTransaction");
            if (out) out.textContent = id;

            const modal = $("#successModal");
            if (modal) {
              modal.classList.add("is-open");
              modal.setAttribute("aria-hidden", "false");
              document.body.classList.add("locked");
            }
          }
        }
      });

      setStatus("Secure checkout is ready.");
    } catch (error) {
      console.error(error);
      setStatus("Checkout could not be initialized.");
    }
  } else {
    setStatus("Checkout setup is pending.");
  }

  $("#buyButton")?.addEventListener("click", () => {
    if (!window.Paddle || !token || !priceId) {
      setStatus("Checkout is not connected yet.");
      return;
    }

    Paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      settings: {
        displayMode: "overlay",
        theme: "light",
        locale: "en"
      }
    });
  });

  $("#closeSuccess")?.addEventListener("click", closeSuccess);
  $("#successModal .scrim")?.addEventListener("click", closeSuccess);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSuccess();
  });
})();