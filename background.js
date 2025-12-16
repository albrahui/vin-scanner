const SNIP_MENU_ID = "snip_area_context_menu";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: SNIP_MENU_ID,
    title: "Scan VIN",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === SNIP_MENU_ID) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "CAPTURE_VISIBLE_TAB") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      sendResponse({ dataUrl: dataUrl });
    });
    return true;
  }

  if (request.action === "START_OCR_POPUP") {
    const ocrUrl = chrome.runtime.getURL(`ocr_popup.html?imageData=${encodeURIComponent(request.imageData)}&tabId=${sender.tab.id}`);
    chrome.windows.create({
      url: ocrUrl,
      type: 'popup',
      width: 350,
      height: 300,
      focused: true
    });
  }

  if (request.action === "OCR_RESULT") {
    chrome.tabs.sendMessage(request.sourceTabId, {
      action: "OCR_POPUP_COMPLETE",
      text: request.text
    });
  }

  if (request.action === "OCR_ERROR_RESULT") {
    chrome.tabs.sendMessage(request.sourceTabId, {
      action: "OCR_POPUP_ERROR",
      error: request.error
    });
  }
});