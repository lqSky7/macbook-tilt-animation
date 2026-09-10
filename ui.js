export async function loadDefaultUIs() {
  const sources = {
    'wallpaper': './assets/wallpapers/ApplePark_2.jpg',
    'blue': './assets/wallpapers/Blue_Mac.jpg',
    'sunflower': './assets/wallpapers/Sunflower_Mac.jpg'
  };
  const images = {};
  for (const [theme, url] of Object.entries(sources)) {
    const img = new Image();
    img.src = url;
    await img.decode();
    images[theme] = img;
  }
  const themes = {};
  const width = 1440;
  const height = 900;
  for (const [theme, img] of Object.entries(images)) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const scale = Math.max(width / img.width, height / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, (width - dw) / 2, (height - dh) / 2, dw, dh);
    themes[theme] = canvas;
  }
  return themes;
}
