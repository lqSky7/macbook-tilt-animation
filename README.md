# MacBook Pro 3D · macOS Tilt &amp; Fold Preview

[![Three.js](https://img.shields.io/badge/Three.js-r186-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![WebGL2](https://img.shields.io/badge/WebGL2-Enabled-990000?style=for-the-badge&logo=webgl)](https://www.khronos.org/webgl/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare_Pages-Deployed-F38020?style=for-the-badge&logo=cloudflare)](https://pages.cloudflare.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

An interactive, high-fidelity 3D **MacBook Pro** browser studio running **macOS**. Experience real-time WebGL rendering, physically accurate lid fold and tilt physics, a dynamic 2560×1600 Retina desktop projection with a live menu bar and glass dock, and curated high-resolution Apple wallpapers.

---

> ###  Looking for the Native macOS App?
> If you have a physical MacBook and want the native app that responds to your **actual hardware lid tilt sensor in real-time**, check out the companion native Swift repository:
> 
> **👉 [lqSky7/iphone-duo-macos-animation](https://github.com/lqSky7/iphone-duo-macos-animation)**  
> *Fully native SwiftUI app written in Swift utilizing the lid tilt sensor!*

---

## ✨ Features

- **Physically Accurate Hinge Mechanics**: Smooth lid fold and tilt rotation from **0° (closed shut)** to **135° (wide viewing angle)** with realistic screen sleep/wake backlight dimming.
- **Dynamic Retina macOS Desktop**: High-resolution 2560×1600 HTML5 canvas projection rendering a live macOS menu bar (Apple menu, status icons, live clock), desktop shortcuts, and an authentic glass dock with app icons.
- **5K Apple &amp; Aesthetic Wallpapers**: Seamlessly switch between official Apple Park architecture, vibrant Blue Waves, Sunflower, and curated landscape wallpapers.
- **Custom Image Projection**: Instant local file upload (`PNG`, `JPG`, `WebP`) to preview any custom photo or mockup on the MacBook display.
- **Photorealistic PBR Materials**: Anodized aluminum unibody chassis, glass screen overlay with specular reflections, and realistic HDRI environment lighting powered by Three.js `RoomEnvironment` and ACES Filmic Tone Mapping.
- **Responsive &amp; Accessible**: Orbit controls with smooth inertia damping, keyboard shortcuts (`Space` to play/pause, `Arrow keys` to fold, `R` to reset camera), and touch gesture support for mobile and tablets.
- **100% SEO Optimized**: Full Open Graph social cards, Twitter cards, semantic crawler fallback markup, and schema.org `WebApplication` JSON-LD structured data for search engine discovery.

---

## 🎮 Interactive Controls &amp; Shortcuts

| Input | Action |
| :--- | :--- |
| **Left Click + Drag** | Orbit camera around the 3D MacBook |
| **Scroll / Pinch** | Zoom in and out |
| **Angle Slider** | Manually adjust lid angle (0° – 135°) |
| **Play / Pause** | Toggle automated breathing fold animation |
| <kbd>Space</kbd> | Toggle fold animation playback |
| <kbd>&larr;</kbd> / <kbd>&rarr;</kbd> | Fold / unfold lid in 2° increments |
| <kbd>R</kbd> | Reset camera to front-facing studio view |

---

## 🛠️ Tech Stack

- **Graphics Engine**: [Three.js](https://threejs.org/) (WebGL2, GLTFLoader, OrbitControls, RoomEnvironment, ACESFilmicToneMapping)
- **UI &amp; Canvas**: Vanilla ES Modules (`main.js`, `ui.js`), HTML5 2D Canvas API for real-time 2.5K desktop composition
- **Styles**: Modern CSS3 Glassmorphism (`backdrop-filter: blur()`), responsive CSS Grid/Flexbox
- **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com/)

---

## 🚀 Run Locally

The web app is completely static without any heavy build dependencies.

```bash
# Clone this repository
git clone https://github.com/lqSky7/macbook-tilt-animation.git
cd macbook-tilt-animation

# Serve locally with any HTTP server (e.g. Python 3)
python3 -m http.server 8080

# Open in browser
open http://localhost:8080
```

---

## 📦 Deployment to Cloudflare Pages

Deploy directly with Wrangler:

```bash
npx wrangler pages deploy . --project-name=macbook-tilt-animation
```

---

## 📄 Credits &amp; Attribution

- Native SwiftUI companion app: [lqSky7/iphone-duo-macos-animation](https://github.com/lqSky7/iphone-duo-macos-animation)
- Concept inspired by [chuspeeism/iphone-duo](https://github.com/chuspeeism/iphone-duo)
- Three.js library by [Mr.doob and contributors](https://github.com/mrdoob/three.js)
- MacBook hardware design © Apple Inc.

---

## 📜 License

Distributed under the [MIT License](LICENSE).
