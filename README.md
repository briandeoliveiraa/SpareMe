# Spare Me!

[![Install on Chrome](https://img.shields.io/badge/Install%20on%20Chrome-C80A2D?logo=googlechrome&logoColor=white&style=flat)](https://chromewebstore.google.com/detail/spare-me/gdhdjpeaoejgficmgkmibmjiccaombja)

Spare Me! is a Chrome extension that streamlines repetitive copy-and-paste tasks by letting you queue up text snippets and paste them sequentially with a single paste command (Ctrl+V). With its intuitive interface and built-in undo feature, Spare Me! is designed to save you time and reduce the hassle of re-copying the same content over and over.

## 🚀 Features
`Queue-Based Pasting:`
Easily add text snippets to your queue and paste them one at a time in the exact order you need.

`Queue Management:`
If you make an error, you can quickly swap positions of different items, or delete items you no longer want to see in your queue.

`Local Storage:`
Your queue, settings, and preferences are stored locally via Chrome’s storage API—ensuring your data never leaves your device.

`Customizable UI:`
A clean, easy-to-use popup interface where you can save, load, edit, and clear your text queue.

`Privacy Focused:`
Spare Me! does not collect or transmit any user data, making it a secure tool for enhancing your productivity.

## 🛠️ Installation

You can find us on the Google Chrome Web Store, or:

`1. Clone the Repository:`

```
git clone https://github.com/yourusername/spare-me.git
cd spare-me
```

`2. Load into Chrome:`
- Open Chrome and navigate to chrome://extensions.
- Enable "Developer mode" (toggle in the top right corner).
- Click "Load unpacked" and select the repository directory.

**The extension will appear in your toolbar, ready to use.**

## ✨ Usage

`Manage Your Queue:`
Open the Spare Me! popup by clicking its icon. Use the provided textarea to add text snippets to your queue. Your queue displays the remaining items in order.

`Paste on Demand:`
Simply press Ctrl+V (or your designated paste key) in any multiline text field (such as in an email editor or a <textarea> element) to automatically paste the next snippet from your queue.

`Undo a Paste:`
If necessary, use Ctrl+Z (within the specified time window) to undo your last pasted item—restoring it back to your queue for re-pasting (Note: This feature is currently a little buggy).

*Tip: For best results, use Spare Me! with editors that support multiline input (e.g., <textarea> or contenteditable elements).*

## 🧩 Customization
`Appearance:`
The UI is defined in popup.html and styled via css/popup.css. You can adjust fonts, colors, and layout as needed.

`Toggle Behavior:`
Spare Me! includes an option (accessible from the popup) to enable/disable custom paste functionality. When disabled, the standard copy-paste behavior is restored.

## 🔐 Privacy
Spare Me! is built with user privacy in mind:

`Local Storage Only:`
All user-entered text and settings are stored locally using Chrome’s storage API.

`No Data Collection:`
The extension does not gather, transmit, or share any personally identifiable or sensitive data with third parties.

## 🤝 Contributing
Contributions and feedback are always welcome! If you encounter issues or have suggestions, please open an issue or submit a pull request.

## 📄 License
This project is distributed under the MIT License.
