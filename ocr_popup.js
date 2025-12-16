document.addEventListener('DOMContentLoaded', async () => {
  const mainStatus = document.getElementById('mainStatus');
  const subStatus = document.getElementById('subStatus');
  const timerBadge = document.getElementById('timerBadge');
  const progressBar = document.getElementById('progressBar');
  const body = document.body;

  const urlParams = new URLSearchParams(window.location.search);
  const imageDataUrl = urlParams.get('imageData');
  const sourceTabId = parseInt(urlParams.get('tabId'));

  const API_KEY = 'YOUR_OPENROUTER_API_KEY_HERE';

  let startTime = Date.now();
  let timerInterval;

  function startTimer() {
    timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
      const seconds = (elapsed % 60).toString().padStart(2, '0');
      timerBadge.textContent = `${minutes}:${seconds}`;
    }, 1000);
  }

  function stopTimer() { clearInterval(timerInterval); }

  function updateUI(main, sub, progressPercent) {
    mainStatus.textContent = main;
    if (sub) subStatus.textContent = sub;
    if (progressPercent) progressBar.style.width = `${progressPercent}%`;
  }

  if (!imageDataUrl) {
    updateUI("خطأ", "لا توجد صورة", 100);
    body.classList.add('error');
    return;
  }

  startTimer();

  const ONLINE_MODELS = [
    { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0" },
    { id: "meta-llama/llama-3.2-11b-vision-instruct:free", name: "Llama 3.2" }
  ];

  async function tryOnlineOCR(modelIndex) {
    if (modelIndex >= ONLINE_MODELS.length) {
      updateUI("فشل الاتصال الذكي", "جاري التحويل للنظام المحلي...", 60);
      await new Promise(r => setTimeout(r, 1000));
      return tryOfflineTesseract();
    }

    const currentModel = ONLINE_MODELS[modelIndex];

    updateUI(
      "جاري المسح الذكي (AI)",
      `محاولة ${modelIndex + 1}/${ONLINE_MODELS.length}: ${currentModel.name}`,
      20 + (modelIndex * 15)
    );

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/VIN-Extension",
          "X-Title": "VIN Scanner"
        },
        body: JSON.stringify({
          model: currentModel.id,
          messages: [{
            role: "user",
            content: [
              { type: "text", text: "Output ONLY the 17-character VIN string. No explanation." },
              { type: "image_url", image_url: { url: imageDataUrl } }
            ]
          }]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`Status ${response.status}`);

      const data = await response.json();
      if (!data.choices || data.choices.length === 0) throw new Error("Empty");

      const text = data.choices[0].message.content.replace(/[^A-Z0-9]/gi, '').trim();

      if (text.length < 11 || text.length > 17) throw new Error("Invalid Length");

      finishSuccess(text, `AI (${currentModel.name})`, "عالية (99%)");

    } catch (err) {
      return tryOnlineOCR(modelIndex + 1);
    }
  }

  async function tryOfflineTesseract() {
    updateUI("المسح المحلي (Offline)", "جاري تحميل المحرك...", 75);

    try {
      const loadScript = (src) => new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL(src);
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

      await loadScript('tesseract.min.js');
      updateUI("المسح المحلي", "جاري تحليل الصورة...", 85);

      const response = await fetch(imageDataUrl);
      const blob = await response.blob();

      const worker = await Tesseract.createWorker('eng', 1, {
        workerPath: chrome.runtime.getURL('worker.min.js'),
        corePath: chrome.runtime.getURL('tesseract-core.wasm.js'),
        langPath: chrome.runtime.getURL(''),
        workerBlobURL: false
      });

      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHJKLMNPRSTUVWXYZ',
        tessedit_pageseg_mode: '7'
      });

      const result = await worker.recognize(blob);
      await worker.terminate();

      const text = result.data.text.trim();
      const confidence = result.data.confidence;
      let confLabel = confidence > 80 ? "عالية" : (confidence > 50 ? "متوسطة" : "منخفضة");

      finishSuccess(text, "Offline Engine", `${confLabel} (${Math.floor(confidence)}%)`);

    } catch (error) {
      stopTimer();
      body.classList.add('error');
      updateUI("فشل العملية", "تعذر المسح نهائياً", 100);

      await chrome.runtime.sendMessage({
        action: "OCR_POPUP_ERROR",
        error: error.message || "Unknown Error",
        sourceTabId: sourceTabId
      });

      setTimeout(() => window.close(), 4000);
    }
  }

  async function finishSuccess(text, source, accuracy) {
    stopTimer();
    body.classList.add('success');

    mainStatus.textContent = "تم النسخ بنجاح!";
    mainStatus.style.color = "#4CAF50";
    subStatus.innerHTML = `المصدر: ${source}<br>الدقة: ${accuracy}`;
    progressBar.style.width = "100%";
    progressBar.style.backgroundColor = "#4CAF50";

    await chrome.runtime.sendMessage({
      action: "OCR_RESULT",
      text: text,
      sourceTabId: sourceTabId
    });

    setTimeout(() => window.close(), 2500);
  }

  tryOnlineOCR(0);
});