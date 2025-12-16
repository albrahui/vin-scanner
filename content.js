(function () {
  if (window.hasRun) return;
  window.hasRun = true;

  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2147483647;
    cursor: crosshair;
    background-color: rgba(0,0,0,0.3);
  `;

  const selection = document.createElement("div");
  selection.style.cssText = `
    position: fixed;
    display: none;
    border: 2px dashed #fff;
    background-color: transparent;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
    pointer-events: none;
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(selection);

  let startX, startY;
  let isDragging = false;

  const onMouseDown = (e) => {
    e.preventDefault();
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;

    selection.style.left = startX + "px";
    selection.style.top = startY + "px";
    selection.style.width = "0px";
    selection.style.height = "0px";
    selection.style.display = "block";
  };

  const onMouseMove = (e) => {
    if (!isDragging) return;

    const currentX = e.clientX;
    const currentY = e.clientY;
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    const left = Math.min(currentX, startX);
    const top = Math.min(currentY, startY);

    selection.style.width = width + "px";
    selection.style.height = height + "px";
    selection.style.left = left + "px";
    selection.style.top = top + "px";
  };

  const onMouseUp = (e) => {
    if (!isDragging) return;

    isDragging = false;
    const rect = selection.getBoundingClientRect();
    const cropConfig = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    };

    overlay.remove();
    selection.remove();
    window.hasRun = false;

    if (cropConfig.width < 50 || cropConfig.height < 20) {
        return;
    }

    setTimeout(() => {
      chrome.runtime.sendMessage({ action: "CAPTURE_VISIBLE_TAB" }, (response) => {
        if (response && response.dataUrl) {
          processAndCropImage(response.dataUrl, cropConfig);
        }
      });
    }, 50);
  };

  overlay.addEventListener("mousedown", onMouseDown);
  overlay.addEventListener("mousemove", onMouseMove);
  overlay.addEventListener("mouseup", onMouseUp);

  function processAndCropImage(dataUrl, crop) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const image = new Image();

    image.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = crop.width * dpr;
      canvas.height = crop.height * dpr;

      ctx.drawImage(
        image,
        crop.left * dpr,
        crop.top * dpr,
        crop.width * dpr,
        crop.height * dpr,
        0, 0,
        canvas.width,
        canvas.height
      );

      const croppedDataUrl = canvas.toDataURL("image/png");

      chrome.runtime.sendMessage({
        action: "START_OCR_POPUP",
        imageData: croppedDataUrl
      });
    };
    image.src = dataUrl;
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "OCR_POPUP_COMPLETE") {
        const text = request.text;

        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        showNotification("✓ Copied: " + text);
    }

    if (request.action === "OCR_POPUP_ERROR") {
        showNotification("✗ Error: " + request.error);
    }
  });

  function showNotification(message) {
    const existing = document.getElementById('ocr-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.id = 'ocr-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2147483647;
      background-color: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      font-size: 14px;
      font-family: Arial, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }
})();