(() => {
  "use strict";

  const cfg = window.DEWIFY_CONFIG || {};
  const product = (cfg.products || []).find(item => item.id === "the-ecom-gambit");
  const $ = selector => document.querySelector(selector);
  const sandbox = String(cfg.PADDLE_ENVIRONMENT || "production").toLowerCase() === "sandbox";
  const token = String((sandbox ? cfg.PADDLE_SANDBOX_CLIENT_TOKEN : cfg.PADDLE_CLIENT_TOKEN) || "").trim();
  const priceId = String((sandbox ? cfg.PADDLE_SANDBOX_PRICE_ID : product?.priceId) || "").trim();
  const downloadUrl = String(product?.downloadUrl || "").trim();
  const downloadFilename = "THE ECOM GAMBIT.pdf";
  const storageKey = "dewify:download-ready:the-ecom-gambit";

  let paddleReady = false;
  let checkoutOpen = false;
  let downloadAssetReady = false;

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

  function setBuyState(ready) {
    const button = $("#buyButton");
    if (!button) return;
    button.disabled = !ready;
    button.textContent = ready ? "Get THE ECOM GAMBIT ↗" : "Checkout unavailable";
  }

  function setDownloadLocked() {
    ["#downloadEcomGambit", "#downloadPersistent"].forEach(selector => {
      const link = $(selector);
      if (!link) return;
      link.removeAttribute("href");
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("tabindex", "-1");
      link.dataset.ready = "false";
      link.classList.add("is-download-locked");
    });

    const label = $("#downloadStateLabel");
    const title = $("#downloadStateTitle");
    const copy = $("#downloadStateCopy");
    if (label) label.textContent = "DOWNLOAD LINK HIDDEN";
    if (title) title.textContent = "Complete checkout to show your download link.";
    if (copy) copy.textContent = "After Paddle confirms checkout in this browser, the PDF download link will appear here.";
    $("#downloadBar")?.classList.add("download-locked");
  }

  function setDownloadLinks() {
    if (!downloadUrl) return;

    ["#downloadEcomGambit", "#downloadPersistent"].forEach(selector => {
      const link = $(selector);
      if (!link) return;
      link.href = downloadUrl;
      link.removeAttribute("aria-disabled");
      link.removeAttribute("tabindex");
      link.dataset.ready = "true";
      link.classList.remove("is-download-locked");
      link.setAttribute("download", downloadFilename);
    });

    const label = $("#downloadStateLabel");
    const title = $("#downloadStateTitle");
    const copy = $("#downloadStateCopy");
    if (label) label.textContent = "DOWNLOAD LINK READY";
    if (title) title.textContent = "Your THE ECOM GAMBIT PDF is ready.";
    if (copy) copy.textContent = "Paddle confirmed checkout in this browser. Your PDF download link is ready.";
    $("#downloadBar")?.classList.remove("download-locked");
  }

  function rememberDownload(transactionId) {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        transactionId: transactionId || "Completed",
        ready: true,
        savedAt: Date.now()
      }));
    } catch (error) {
      console.warn("Could not remember the download state:", error);
    }
  }

  function showDownloadBar() {
    const bar = $("#downloadBar");
    if (!bar) return;
    setDownloadLinks();
    bar.hidden = false;
  }

  function restoreDownload() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved?.ready && downloadAssetReady) showDownloadBar();
      else setDownloadLocked();
    } catch (error) {
      console.warn("Could not restore the download state:", error);
      setDownloadLocked();
    }
  }

  function openSuccess(transactionId) {
    const transaction = $("#successTransaction");
    if (transaction) transaction.textContent = transactionId || "Completed";

    const modal = $("#successModal");
    if (modal) {
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
    }

    window.setTimeout(() => $("#downloadEcomGambit")?.focus(), 40);
  }

  function closeSuccess() {
    const modal = $("#successModal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    $("#buyButton")?.focus();
  }

  function showSuccess(event) {
    const transactionId = event?.data?.transaction_id || "Completed";
    rememberDownload(transactionId);
    setDownloadLinks();
    showDownloadBar();
    setStatus("Checkout completed. Your PDF download is ready.", "success");
    openSuccess(transactionId);
  }

  async function checkDownloadAsset() {
    if (!downloadUrl) return false;

    try {
      const response = await fetch(downloadUrl, {
        method: "HEAD",
        cache: "no-store",
        credentials: "omit"
      });
      return response.ok;
    } catch (error) {
      console.warn("Could not verify the product download file:", error);
      return false;
    }
  }

  async function setLocalizedPrice() {
    if (!window.Paddle || !priceId) return;

    try {
      const result = await Paddle.PricePreview({
        items: [{ priceId, quantity: 1 }]
      });
      const line = result?.data?.details?.lineItems?.[0];
      const localized = line?.formattedTotals?.total ||
        line?.formattedUnitTotals?.total ||
        line?.formattedTotals?.subtotal ||
        line?.formattedUnitTotals?.subtotal;
      setPrice(localized || "Final price at checkout");
    } catch (error) {
      console.warn("Paddle localized price preview failed:", error);
      setPrice("Final price at checkout");
    }
  }

  async function initializePaddle() {
    setBuyState(false);
    setDownloadLocked();
    setStatus("Checking product file and Paddle checkout…");

    downloadAssetReady = await checkDownloadAsset();

    if (!downloadAssetReady) {
      setStatus("Product PDF not uploaded. Add THE ECOM GAMBIT.pdf to the site root before enabling checkout.", "error");
    }

    if (!window.Paddle) {
      setStatus("Paddle checkout could not load. Refresh the page and try again.", "error");
      return;
    }

    if (!token || !priceId) {
      setStatus(
        sandbox
          ? "Sandbox client token and sandbox price ID are not configured."
          : "Paddle product configuration is incomplete.",
        "error"
      );
      return;
    }

    try {
      if (sandbox) Paddle.Environment.set("sandbox");

      Paddle.Initialize({
        token,
        eventCallback: event => {
          if (event?.name === "checkout.completed") {
            checkoutOpen = false;

            const paymentMethod = String(
              event?.data?.payment?.method_details?.type ||
              event?.data?.payment?.method_details?.kebab_type ||
              ""
            ).toLowerCase();
            const checkoutStatus = String(event?.data?.status || "").toLowerCase();

            // Deferred UPI methods can complete checkout UI before payment capture.
            if (paymentMethod === "upi" && !["paid", "completed"].includes(checkoutStatus)) {
              setDownloadLocked();
              setStatus("UPI payment submitted. Waiting for Paddle to confirm payment…");
              return;
            }

            if (!downloadAssetReady) {
              setStatus("Payment completed, but the product PDF is missing from the site. Contact DEWIFY support.", "error");
              return;
            }

            showSuccess(event);
            return;
          }

          if (event?.name === "checkout.closed") {
            checkoutOpen = false;
          }

          if (event?.name === "checkout.payment.failed" || event?.name === "checkout.payment.error") {
            checkoutOpen = false;
            setDownloadLocked();
            setStatus("Payment was not completed. You can try checkout again.", "error");
            setBuyState(downloadAssetReady);
            return;
          }

          if (event?.name === "checkout.error" || event?.name === "checkout.warning") {
            checkoutOpen = false;
            setStatus("Paddle: " + (event?.detail || event?.code || "Checkout could not complete."), "error");
            setBuyState(downloadAssetReady);
          }
        }
      });

      paddleReady = true;
      await setLocalizedPrice();
      restoreDownload();

      if (downloadAssetReady) {
        setBuyState(true);
        setStatus("Paddle checkout is ready. Final tax and currency are confirmed in checkout.");
      } else {
        setBuyState(false);
        setStatus("Product PDF not uploaded. Add THE ECOM GAMBIT.pdf to the site root before enabling checkout.", "error");
      }
    } catch (error) {
      setStatus("Paddle initialization failed: " + (error?.message || "initialize_failed"), "error");
      console.error("Paddle initialization failed:", error);
    }
  }

  $("#buyButton")?.addEventListener("click", () => {
    if (!paddleReady || !downloadAssetReady || !window.Paddle || checkoutOpen) {
      setStatus("Checkout is not ready yet. Check the product file and Paddle configuration.", "error");
      return;
    }

    try {
      checkoutOpen = true;
      setStatus("Opening Paddle checkout…");

      const checkout = {
        items: [{ priceId, quantity: 1 }],
        settings: {
          displayMode: "overlay",
          theme: "light",
          locale: "en"
        }
      };

      const promotionCode = String(cfg.ECOM_GAMBIT_PROMO_CODE || "").trim();
      if (promotionCode) checkout.discountCode = promotionCode;

      Paddle.Checkout.open(checkout);
    } catch (error) {
      checkoutOpen = false;
      setStatus("Paddle checkout failed: " + (error?.message || "open_failed"), "error");
      console.error("Paddle.Checkout.open failed:", error);
    }
  });

  ["#downloadEcomGambit", "#downloadPersistent"].forEach(selector => {
    $(selector)?.addEventListener("click", event => {
      const link = $(selector);
      if (link?.dataset?.ready !== "true" || !downloadAssetReady) {
        event.preventDefault();
        setStatus("Complete checkout in this browser to display the download link.");
        return;
      }
      setStatus("Your PDF download is starting.");
    });
  });

  $("#closeSuccess")?.addEventListener("click", closeSuccess);
  $("#successModal .scrim")?.addEventListener("click", closeSuccess);
  window.addEventListener("keydown", event => {
    if (event.key === "Escape" && $("#successModal")?.classList.contains("is-open")) {
      closeSuccess();
    }
  });

  window.addEventListener("load", initializePaddle, { once: true });
})();
