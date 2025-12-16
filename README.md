# VIN Scanner Extension
A Chrome Extension for scanning and extracting Vehicle Identification Numbers (VIN) from images or screen text.

## Features
- **Hybrid Scanning:** Uses Cloud AI (Google Gemini, Llama) for high accuracy, falls back to local Tesseract OCR if offline.
- **VIN Optimization:** Automatically corrects common OCR errors (I -> 1, O -> 0).
- **Instant Copy:** Scanned text is automatically copied to the clipboard.

## Installation
1. Clone this repository.
2. Get a free API Key from [OpenRouter](https://openrouter.ai).
3. Open `ocr_popup.js` and paste your key into `const API_KEY = '...';`.
4. Go to `chrome://extensions`, enable "Developer mode", and "Load unpacked" this folder.
