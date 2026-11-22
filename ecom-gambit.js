(() => {
  "use strict";

  const cfg = window.DEWIFY_CONFIG || {};
  const product = (cfg.products || []).find(item => item.id === "the-ecom-gambit");
  const $ = selector => document.querySelector(selector);
  const sandbox = String(cfg.PADDLE_ENVIRONMENT || "production").toLowerCase() === "sandbox";
  const apiBase = String(cfg.PADDLE_FULFILLMENT_API_URL || "").trim().replace(/\/+$/, "");
  const token = sandbox ? String(cfg.PADDLE_SANDBOX_CLIENT_TOKEN || "").trim() : String(cfg.PADDLE_CLIENT_TOKEN || "").trim();
  const priceId = sandbox ? String(cfg.PADDLE_SANDBOX_PRICE_ID || "").trim() : String(product?.priceId || "").trim();
  const productId = sandbox ? String(cfg.PADDLE_SANDBOX_PRODUCT_ID || "").trim() : String(product?.productId || "").trim();
  const pendingKey = "dewify:ecom-gambit:pending:v1";

  let paddleReady = false;
  let checkoutOpen = false;
  let deliveryBusy = false;
  let currentObjectUrl = "";

  function setStatus(message, state = "normal") {
    const status = $("#checkoutStatus");
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state;
  }

  function setPrice(value) {
    const price = $("#productPrice");
    if (price && value) price.textContent = value;
  }

  function randomNonce() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function loadCover() {
    const cover = $("#bookCover");
    const fallback = $("#coverFallback");
    if (!cover || !fallback || !apiBase) return;
    cover.src = apiBase + "/cover";
    cover.addEventListener("load", () => {
      cover.hidden = false;
      fallback.hidden = true;
    }, { once: true });
  }

  function readPending() {
    try {
      const value = JSON.parse(sessionStorage.getItem(pendingKey) || "null");
      if (typeof value?.transactionId === "string" && typeof value?.nonce === "string") return value;
    } catch {}
    return null;
  }

  function savePending(value) {
    try {
      sessionStorage.setItem(pendingKey, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function showDeliveryPanel(message) {
    const panel = $("#deliveryPanel");
    const checkButton = $("#checkDelivery");
    if (panel) panel.hidden = false;
    if (checkButton) checkButton.hidden = false;
    const messageNode = $("#deliveryMessage");
    if (messageNode) messageNode.textContent = message;
  }

  function showDownload(blob) {
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = URL.createObjectURL(blob);
    const link = $("#downloadFile");
    if (!link) return;
    link.href = currentObjectUrl;
    link.hidden = false;
    link.textContent = "Download THE ECOM GAMBIT PDF ↗";
    const checkButton = $("#checkDelivery");
    if (checkButton) checkButton.hidden = true;
    const message = $("#deliveryMessage");
    if (message) message.textContent = "Server verification passed. Your PDF is ready. Use the download link below.";
    setStatus("Payment verified by the server. Your PDF is ready.", "success");
  }

  async function requestVerifiedPdf(pending) {
    const response = await fetch(apiBase + "/api/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify({
        transaction_id: pending.transactionId,
        delivery_nonce: pending.nonce
      })
    });

    if (response.status === 404) return { pending: true };
    if (response.status === 429) throw new Error("The download limit for this order has been reached. Contact support if you need help.");
    if (!response.ok) {
      let message = "Secure delivery is temporarily unavailable.";
      try {
        const data = await response.json();
        if (data.error === "digital_file_not_uploaded") message = "The PDF file has not been uploaded to secure storage yet.";
      } catch {}
      throw new Error(message);
    }

    const blob = await response.blob();
    if (blob.type && blob.type !== "application/pdf") throw new Error("The delivery response was not a PDF file.");
    return { pending: false, blob };
  }

  async function checkDelivery() {
    if (deliveryBusy) return;
    if (!apiBase) {
      setStatus("Secure delivery is not connected yet. Checkout is disabled.", "error");
      return;
    }
    const pending = readPending();
    if (!pending) {
      setStatus("No completed checkout was found in this browser session.", "error");
      return;
    }

    deliveryBusy = true;
    const button = $("#checkDelivery");
    if (button) {
      button.disabled = true;
      button.textContent = "Verifying payment…";
    }
    setStatus("Waiting for the signed Paddle payment notification…");
    showDeliveryPanel("Checking the server-side payment record. The browser callback alone does not unlock the PDF.");

    try {
      for (let attempt = 0; attempt < 9; attempt += 1) {
        const result = await requestVerifiedPdf(pending);
        if (!result.pending) {
          showDownload(result.blob);
          return;
        }
        if (attempt < 8) await new Promise(resolve => setTimeout(resolve, 1500));
      }
      setStatus("Paddle has not finished recording the payment yet. Use Verify & prepare download again in a moment.");
      const message = $("#deliveryMessage");
      if (message) message.textContent = "The signed transaction.completed notification has not reached the fulfillment service yet. No download has been granted.";
    } catch (error) {
      setStatus(error?.message || "Secure delivery failed. Contact support.", "error");
      const message = $("#deliveryMessage");
      if (message) message.textContent = error?.message || "Secure delivery failed. Contact support.";
    } finally {
      deliveryBusy = false;
      if (button && !$("#downloadFile")?.hidden) {
        button.hidden = true;
      } else if (button) {
        button.disabled = false;
        button.textContent = "Verify & prepare download";
      }
    }
  }

  function initializePaddle() {
    const button = $("#buyButton");
    if (button) {
      button.disabled = true;
      button.textContent = "Preparing checkout…";
    }

    if (!window.Paddle) {
      setStatus("Paddle.js could not load. Refresh the page and try again.", "error");
      return;
    }
    if (!token || !priceId || !productId) {
      setStatus(sandbox ? "Sandbox token and sandbox product/price IDs are not configured." : "Paddle product configuration is incomplete.", "error");
      if (button) button.textContent = "Checkout unavailable";
      return;
    }

    try {
      if (sandbox) Paddle.Environment.set("sandbox");
      Paddle.Initialize({
        token,
        eventCallback: event => {
          if (event?.name === "checkout.completed") {
            checkoutOpen = false;
            const transactionId = event?.data?.transaction_id;
            const pending = readPending();
            if (!transactionId || !pending?.nonce) {
              setStatus("Checkout completed, but this tab could not recover the delivery claim. Contact support with your Paddle transaction ID.", "error");
              return;
            }
            pending.transactionId = transactionId;
            savePending(pending);
            showDeliveryPanel("Paddle reports that checkout completed. The PDF will be released only after the server verifies the signed transaction.completed notification.");
            setStatus("Checkout completed. Verify your payment to prepare the PDF.", "success");
            const deliveryButton = $("#checkDelivery");
            if (deliveryButton) deliveryButton.hidden = false;
          } else if (event?.name === "checkout.closed") {
            checkoutOpen = false;
          } else if (["checkout.error", "checkout.payment.error", "checkout.warning"].includes(event?.name)) {
            checkoutOpen = false;
            setStatus("Paddle could not complete checkout. Review the message in checkout and try again.", "error");
          }
        }
      });
      paddleReady = true;
      setStatus(apiBase ? "Paddle checkout is ready. The final localized total appears in checkout." : "Secure delivery backend is not connected. Checkout is disabled.");
      if (button && apiBase) {
        button.disabled = false;
        button.textContent = "Get THE ECOM GAMBIT ↗";
      } else if (button) {
        button.disabled = true;
        button.textContent = "Checkout unavailable";
      }

      Paddle.PricePreview({ items: [{ priceId, quantity: 1 }] }).then(result => {
        const line = result?.data?.details?.lineItems?.[0];
        const localized = line?.formattedTotals?.total ||
          line?.formattedUnitTotals?.total ||
          line?.formattedTotals?.subtotal ||
          line?.formattedUnitTotals?.subtotal;
        if (localized) setPrice(localized);
        else setPrice("Final price at checkout");
      }).catch(error => {
        console.warn("Paddle localized price preview failed:", error);
        setPrice("Final price at checkout");
      });
    } catch (error) {
      setStatus("Paddle initialization failed. Please refresh and try again.", "error");
      console.error("Paddle initialization error:", error);
    }
  }

  $("#buyButton")?.addEventListener("click", () => {
    if (!apiBase || !paddleReady || !window.Paddle || checkoutOpen) return;
    const nonce = randomNonce();
    if (!savePending({ nonce, transactionId: "" })) {
      setStatus("This browser could not save the one-time delivery claim. Enable session storage and try again.", "error");
      return;
    }

    checkoutOpen = true;
    setStatus("Opening Paddle checkout…");
    const checkout = {
      items: [{ priceId, quantity: 1 }],
      customData: { sku: "the-ecom-gambit", delivery_nonce: nonce },
      settings: { displayMode: "overlay", theme: "light", locale: "en" }
    };
    const promotionCode = String(cfg.ECOM_GAMBIT_PROMO_CODE || "").trim();
    if (promotionCode) checkout.discountCode = promotionCode;

    try {
      Paddle.Checkout.open(checkout);
    } catch (error) {
      checkoutOpen = false;
      setStatus("Paddle checkout could not open. Please try again.", "error");
      console.error("Paddle checkout open failed:", error);
    }
  });

  $("#checkDelivery")?.addEventListener("click", checkDelivery);

  loadCover();
  const pending = readPending();
  if (pending?.transactionId) {
    showDeliveryPanel("A completed checkout was found in this tab. Verify the server-side payment record to prepare the PDF.");
    const button = $("#checkDelivery");
    if (button) button.hidden = false;
  }

  window.addEventListener("load", initializePaddle, { once: true });
})();
