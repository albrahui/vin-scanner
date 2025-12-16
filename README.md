# Smart VIN Scanner Extension

A powerful Chrome Extension designed to extract Vehicle Identification Numbers (VIN) from any image or text on your screen.

This tool uses a **Hybrid Scanning Engine**: it first attempts to use advanced Cloud AI (Google Gemini 2.0 / Llama 3.2) for maximum accuracy. If the internet is unstable or the server is busy, it automatically falls back to an offline OCR engine (Tesseract.js) to ensure you always get a result.

## 🚀 Features

* **Hybrid Intelligence:** Combines the accuracy of Large Language Models (LLM) with the reliability of local OCR.
* **Smart Validation:** Automatically corrects common VIN OCR errors (e.g., converting 'I' to '1', 'O' to '0').
* **Instant Workflow:** Scans, extracts, and copies the result to your clipboard in seconds.
* **Offline Fallback:** Continues to work even without an internet connection using a local Wasm-based engine.
* **Privacy Focused:** Your API key works directly from your browser; no intermediate data collection servers.

## 🛠️ Installation

1.  **Clone or Download** this repository to your computer.
2.  Open Google Chrome and navigate to `chrome://extensions`.
3.  Enable **Developer mode** (toggle in the top right corner).
4.  Click **Load unpacked** and select the folder containing these files.

## ⚙️ Configuration (Required)

To enable the high-accuracy AI features, you need a free API key from OpenRouter.

1.  Get your key from [OpenRouter.ai](https://openrouter.ai/).
2.  Open the file `ocr_popup.js` in a text editor (like Notepad or VS Code).
3.  Find line 12:
    ```javascript
    const API_KEY = 'YOUR_OPENROUTER_API_KEY_HERE';
    ```
4.  Replace `YOUR_OPENROUTER_API_KEY_HERE` with your actual key.
5.  Save the file and click the **Reload** icon on the extension in `chrome://extensions`.

## 📖 How to Use

1.  **Right-click** anywhere on a webpage.
2.  Select **"برنامج لنسخ ارقام الهيكل"** (Scan VIN) from the menu.
3.  **Click and drag** to draw a box around the VIN number you want to copy.
4.  A status window will appear showing the scanning progress.
5.  Once finished, the VIN is automatically copied to your clipboard, and you will see a notification: **"✓ Copied Successfully"**.

## 📄 License

This project is licensed under the **MIT License** - see the LICENSE file for details.
