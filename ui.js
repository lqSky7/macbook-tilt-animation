/**
 * High-fidelity macOS Desktop Canvas Renderer for MacBook Pro 3D Display
 * Renders Retina resolution macOS interface (Menu bar, Wallpaper, Dock, Apps)
 */

export const WALLPAPERS = [
  { id: 'apple-park', name: 'Apple Park', file: 'ApplePark_2.jpg' },
  { id: 'blue-mac', name: 'Blue Waves', file: 'Blue_Mac.jpg' },
  { id: 'sunflower', name: 'Sunflower', file: 'Sunflower_Mac.jpg' },
  { id: 'wallhaven-neon', name: 'Cyber Peak', file: 'wallhaven-8grlyj.jpg' },
  { id: 'wallhaven-landscape', name: 'Valley', file: 'wallhaven-5ymlv9.jpg' },
  { id: 'wallhaven-sunset', name: 'Sunset Drift', file: 'wallhaven-jedr8p.jpg' },
  { id: 'wallhaven-forest', name: 'Moody Forest', file: 'wallhaven-e8w22r.jpg' },
  { id: 'wallhaven-dark', name: 'Minimal Dark', file: 'wallhaven-d8dzdj.jpg' },
  { id: 'wallhaven-cosmic', name: 'Cosmic Night', file: 'wallhaven-rqp9jw.jpg' },
  { id: 'wallhaven-flow', name: 'Color Gradient', file: 'wallhaven-lyj3xl.jpg' },
];

export class MacOSScreen {
  constructor(canvas) {
    this.canvas = canvas;
    this.canvas.width = 2560;
    this.canvas.height = 1600;
    this.ctx = canvas.getContext('2d');
    this.cachedImages = new Map();
    this.currentWallpaperImg = null;
    this.currentWallpaperId = 'apple-park';
  }

  async loadWallpaper(fileOrUrl) {
    if (this.cachedImages.has(fileOrUrl)) {
      return this.cachedImages.get(fileOrUrl);
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.cachedImages.set(fileOrUrl, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = fileOrUrl.startsWith('data:') || fileOrUrl.startsWith('blob:')
        ? fileOrUrl
        : `./assets/wallpapers/${fileOrUrl}`;
    });
  }

  async setWallpaperById(id) {
    const item = WALLPAPERS.find(w => w.id === id);
    if (!item) return;
    this.currentWallpaperId = id;
    try {
      const img = await this.loadWallpaper(item.file);
      this.currentWallpaperImg = img;
      this.render();
      return true;
    } catch (e) {
      console.error('Failed to load wallpaper:', e);
      return false;
    }
  }

  setCustomImage(img) {
    this.currentWallpaperId = 'custom';
    this.currentWallpaperImg = img;
    this.render();
  }

  render() {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;

    // 1. Wallpaper background
    if (this.currentWallpaperImg) {
      const img = this.currentWallpaperImg;
      const scale = Math.max(w / img.width, h / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    } else {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Desktop Items (Macintosh HD)
    this.renderDesktopIcons(ctx, w, h);

    // 3. macOS Top Menu Bar
    this.renderMenuBar(ctx, w, h);

    // 4. macOS Dock
    this.renderDock(ctx, w, h);
  }

  renderMenuBar(ctx, w, h) {
    const barHeight = 44;

    // Frosted menu bar backing
    ctx.save();
    ctx.fillStyle = 'rgba(15, 18, 26, 0.35)';
    ctx.fillRect(0, 0, w, barHeight);

    // Subtle bottom border
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(0, barHeight - 1, w, 1);

    // Left Menu Items
    ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';

    // Apple Logo
    const logoY = barHeight / 2;
    ctx.fillText('', 28, logoY - 1);

    // Menu titles
    const menus = ['Finder', 'File', 'Edit', 'View', 'Go', 'Window', 'Help'];
    let curX = 64;
    menus.forEach((item, index) => {
      ctx.font = index === 0
        ? '700 17px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif'
        : '500 17px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif';
      ctx.fillStyle = index === 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.9)';
      ctx.fillText(item, curX, logoY);
      curX += ctx.measureText(item).width + 24;
    });

    // Right Menu Status Items
    let rightX = w - 30;

    // Clock
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const dateNum = now.getDate();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const timeStr = `${dayName} ${monthName} ${dateNum}  ${hours}:${minutes} ${ampm}`;

    ctx.font = '500 16px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.textAlign = 'right';
    ctx.fillText(timeStr, rightX, logoY);
    rightX -= ctx.measureText(timeStr).width + 22;

    // Control Center Icon (two pill sliders)
    ctx.textAlign = 'left';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(rightX - 22, logoY - 8, 20, 16);
    ctx.fillRect(rightX - 18, logoY - 5, 5, 4);
    ctx.fillRect(rightX - 9, logoY + 1, 5, 4);
    rightX -= 38;

    // Spotlight (magnifying glass)
    ctx.beginPath();
    ctx.arc(rightX - 12, logoY - 2, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rightX - 8, logoY + 2);
    ctx.lineTo(rightX - 4, logoY + 6);
    ctx.stroke();
    rightX -= 30;

    // Wi-Fi arcs
    ctx.beginPath();
    ctx.arc(rightX - 10, logoY + 4, 10, -Math.PI * 0.75, -Math.PI * 0.25);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(rightX - 10, logoY + 4, 6, -Math.PI * 0.75, -Math.PI * 0.25);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(rightX - 10, logoY + 3, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    rightX -= 32;

    // Battery (outline + fill + terminal)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(rightX - 26, logoY - 6, 22, 12);
    ctx.fillRect(rightX - 24, logoY - 4, 18, 8); // full charge
    ctx.fillRect(rightX - 4, logoY - 2, 2, 4);   // battery tip
    ctx.font = '500 13px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'right';
    ctx.fillText('100%', rightX - 30, logoY);

    ctx.restore();
  }

  renderDesktopIcons(ctx, w, h) {
    ctx.save();
    // Macintosh HD icon (top right)
    const iconX = w - 100;
    const iconY = 80;

    // Outer disk casing
    ctx.fillStyle = 'rgba(215, 220, 230, 0.9)';
    ctx.beginPath();
    this.roundRect(ctx, iconX, iconY, 60, 42, 6);
    ctx.fill();

    // Drive line & led
    ctx.fillStyle = '#334155';
    ctx.fillRect(iconX + 8, iconY + 28, 36, 4);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(iconX + 50, iconY + 30, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.font = '500 14px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1;
    ctx.fillText('Macintosh HD', iconX + 30, iconY + 60);

    ctx.restore();
  }

  renderDock(ctx, w, h) {
    ctx.save();

    const apps = [
      { name: 'Finder', color: '#38bdf8', icon: 'finder', active: true },
      { name: 'Launchpad', color: '#94a3b8', icon: 'grid', active: false },
      { name: 'Safari', color: '#0284c7', icon: 'compass', active: true },
      { name: 'Messages', color: '#22c55e', icon: 'chat', active: false },
      { name: 'Mail', color: '#3b82f6', icon: 'mail', active: false },
      { name: 'Photos', color: '#f59e0b', icon: 'flower', active: false },
      { name: 'Music', color: '#ec4899', icon: 'note', active: true },
      { name: 'Terminal', color: '#18181b', icon: 'term', active: true },
      { name: 'Settings', color: '#64748b', icon: 'gear', active: false },
    ];

    const iconSize = 64;
    const gap = 16;
    const padX = 22;
    const padY = 12;
    const dockHeight = iconSize + padY * 2;
    const dockWidth = apps.length * iconSize + (apps.length - 1) * gap + padX * 2 + 30; // + space for divider and trash
    const dockX = (w - dockWidth) / 2;
    const dockY = h - dockHeight - 16;

    // Glass dock pill background
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 10;

    const dockGrad = ctx.createLinearGradient(dockX, dockY, dockX, dockY + dockHeight);
    dockGrad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
    dockGrad.addColorStop(1, 'rgba(220, 230, 245, 0.18)');
    ctx.fillStyle = dockGrad;
    ctx.beginPath();
    this.roundRect(ctx, dockX, dockY, dockWidth, dockHeight, 26);
    ctx.fill();

    // Dock outline border
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Render individual app icons
    let curX = dockX + padX;
    const appY = dockY + padY;

    apps.forEach((app) => {
      this.renderAppIcon(ctx, curX, appY, iconSize, app);

      // Running dot
      if (app.active) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(curX + iconSize / 2, dockY + dockHeight - 5, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      curX += iconSize + gap;
    });

    // Divider line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(curX - gap / 2 + 5, appY + 8);
    ctx.lineTo(curX - gap / 2 + 5, appY + iconSize - 8);
    ctx.stroke();

    // Trash Can Icon
    curX += 8;
    this.renderTrashIcon(ctx, curX, appY, iconSize);

    ctx.restore();
  }

  renderAppIcon(ctx, x, y, size, app) {
    ctx.save();

    // Icon rounded rect with slight shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;

    const r = size * 0.22;
    ctx.beginPath();
    this.roundRect(ctx, x, y, size, size, r);

    // Gradients per app
    if (app.icon === 'finder') {
      const grad = ctx.createLinearGradient(x, y, x, y + size);
      grad.addColorStop(0, '#60a5fa');
      grad.addColorStop(1, '#2563eb');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      // Finder smile & line
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + size * 0.47, y + size * 0.25, size * 0.06, size * 0.3);
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.55, size * 0.22, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    } else if (app.icon === 'compass') {
      // Safari
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.shadowColor = 'transparent';
      const cGrad = ctx.createLinearGradient(x, y, x + size, y + size);
      cGrad.addColorStop(0, '#0284c7');
      cGrad.addColorStop(1, '#38bdf8');
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size * 0.42, 0, Math.PI * 2);
      ctx.fill();
      // Needle
      ctx.save();
      ctx.translate(x + size / 2, y + size / 2);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.35);
      ctx.lineTo(size * 0.08, 0);
      ctx.lineTo(-size * 0.08, 0);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, size * 0.35);
      ctx.lineTo(size * 0.08, 0);
      ctx.lineTo(-size * 0.08, 0);
      ctx.fill();
      ctx.restore();
    } else if (app.icon === 'term') {
      // Terminal
      ctx.fillStyle = '#18181b';
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.font = `700 ${size * 0.34}px monospace`;
      ctx.fillStyle = '#4ade80';
      ctx.fillText('>_', x + size * 0.2, y + size * 0.58);
    } else if (app.icon === 'chat') {
      // Messages
      const grad = ctx.createLinearGradient(x, y, x, y + size);
      grad.addColorStop(0, '#34d399');
      grad.addColorStop(1, '#059669');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      this.roundRect(ctx, x + size * 0.22, y + size * 0.25, size * 0.56, size * 0.44, size * 0.18);
      ctx.fill();
    } else if (app.icon === 'note') {
      // Music
      const grad = ctx.createLinearGradient(x, y, x + size, y + size);
      grad.addColorStop(0, '#f43f5e');
      grad.addColorStop(1, '#e11d48');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.font = `600 ${size * 0.44}px -apple-system, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText('♫', x + size * 0.32, y + size * 0.65);
    } else {
      // Generic polished app
      const grad = ctx.createLinearGradient(x, y, x, y + size);
      grad.addColorStop(0, app.color);
      grad.addColorStop(1, '#334155');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderTrashIcon(ctx, x, y, size) {
    ctx.save();
    // Glass wireframe trash can
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size * 0.3, size * 0.2, Math.PI, 0, false);
    ctx.stroke();
    ctx.strokeRect(x + size * 0.3, y + size * 0.32, size * 0.4, size * 0.45);
    ctx.restore();
  }

  roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
  }
}
