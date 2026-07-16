# Manado Post HTML5 Mini-Apps

This repository contains all the lightweight HTML5 mini-applications and casual games integrated directly into the core Manado Post ecosystem. These features are delivered via internal WebViews to enhance user engagement within our main mobile application.

---

## 🚀 Quick Walkthrough

### Tech Stack Philosophy
To keep the performance overhead exceptionally low and ensure maximum compatibility, we enforce a **minimalist tech stack approach**. 

* **Core:** Semantic HTML5, CSS3, and Vanilla JavaScript.
* **Runtime:** Optimized to run strictly within native mobile WebViews (iOS and Android).
* **Rule of Thumb:** Avoid heavy frameworks (like React or Angular) unless absolutely pre-approved by core developers, as our primary goal is near-instant load times.

### Repository Structure
Each mini-app lives in its own standalone directory at the root level. The internal architecture looks like this:

```
├── exampleGame1/               # Name of the specific Mini-App / Game
│   ├── assets/                 # Images, audio, and font files
│   ├── css/                    # Stylesheets
│   ├── js/                     # Application logic
│   └── index.html              # Main entry point for the WebView
├── exampleGame2/
│   ├── assets/                 # These inner folder structure are example only
│   ├── css/                    # This can be modified to suit your project needs
│   └── index.html              # As long as it lives inside the main folder (e.g: exampleGame)
└── README.md                   # You are here
```
---

## 🔗 Manado Post Bridge

The **Manado Post Bridge** is our proprietary communication layer that handles data exchange (such as game score integration, and other data sharing mechanism) between your HTML5 mini-app and the main Manado Post application.

> ⚠️ **Implementation Note:** Detailed specifications, and API endpoints for the Bridge will be explained directly by the Core Development Team during project onboarding meetings. 

---

## 🤝 How to Contribute

We manage our features, bug tracking, and development roadmap visually. Before writing any code or introducing a new mini-app concept, please sync with the team workflow:

* **MP Development Workflow:** [[Manado Post Development Workflow](https://www.figma.com/board/5TsdfOzpCGTn574OKUZ5cI/MP---Public-Info-Board?node-id=0-1&t=XHdtDL5LQgvROpFf-1)]

Please ensure you create a feature branch off the main branch before submitting a Pull Request. And make sure to follow the Manado Post PR Workflow that can be found in:

* **MP PR Workflow:** [[Manado Post PR Workflow](https://docs.google.com/document/d/1dbxeswDJyj5pmXnMxIVZfo3nuq-53WTYZxY7XEMffS4/edit?usp=sharing)]

---

## ✅ Definitions of Done (DoD)

Before any mini-app or game is approved for static hosting and merged into production, it must fulfill the following criteria:

* **Ultra-Lightweight Footprint:** The absolute minimum asset size possible. All scripts must be minified, and images/audio must be heavily compressed to minimize bandwidth impact on static hosting.
* **WebView Compatibility:** Seamless execution across standard iOS WebKit and Android AndroidX WebView engines.
* **Cross-Platform Responsive Design:** Fully tested across a diverse range of screen aspect ratios, OS versions, and varying hardware capabilities (low-end to high-end devices).
* **Graceful Degradation:** The mini-app fail gracefully if internet speeds drop or if specific non-essential browser APIs are missing in older system WebViews.