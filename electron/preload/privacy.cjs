'use strict';
/**
 * Frame preload for web pages (registered per session). Runs in every http(s) frame:
 *  - Global Privacy Control: navigator.globalPrivacyControl = true
 *  - Strict fingerprint mode: seeded canvas/audio noise, fixed hardwareConcurrency/deviceMemory
 * Settings are read synchronously from main so the patches are in place before page scripts run.
 */
const { ipcRenderer, webFrame } = require('electron');

if (location.protocol === 'http:' || location.protocol === 'https:') {
  let cfg = null;
  try { cfg = ipcRenderer.sendSync('privacy:config'); } catch (e) { cfg = null; }

  if (cfg && (cfg.gpc || cfg.fingerprint === 'strict')) {
    const code = `(function (cfg) {
      try {
        if (cfg.gpc) Object.defineProperty(Navigator.prototype, 'globalPrivacyControl', { get: function () { return true; }, configurable: true });
        if (cfg.fingerprint !== 'strict') return;
        function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
        function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
        var rand = rng(cfg.seed ^ hash(location.hostname));
        function noisify(d) { for (var i = 0; i < d.length; i += 4) { if (rand() < 0.02) d[i] ^= 1; } }
        var getImageData = CanvasRenderingContext2D.prototype.getImageData;
        CanvasRenderingContext2D.prototype.getImageData = function () { var img = getImageData.apply(this, arguments); noisify(img.data); return img; };
        function noisyCopy(c) {
          if (!c.width || !c.height || c.width * c.height > 16e6) return c;
          var t = document.createElement('canvas'); t.width = c.width; t.height = c.height;
          var x = t.getContext('2d'); x.drawImage(c, 0, 0);
          var img = getImageData.call(x, 0, 0, t.width, t.height); noisify(img.data); x.putImageData(img, 0, 0); return t;
        }
        var toDataURL = HTMLCanvasElement.prototype.toDataURL;
        HTMLCanvasElement.prototype.toDataURL = function () { return toDataURL.apply(noisyCopy(this), arguments); };
        var toBlob = HTMLCanvasElement.prototype.toBlob;
        HTMLCanvasElement.prototype.toBlob = function () { return toBlob.apply(noisyCopy(this), arguments); };
        var seen = new WeakSet();
        var getChannelData = AudioBuffer.prototype.getChannelData;
        AudioBuffer.prototype.getChannelData = function () {
          var data = getChannelData.apply(this, arguments);
          if (!seen.has(data)) { seen.add(data); for (var i = 0; i < data.length; i += 100) data[i] += (rand() - 0.5) * 1e-7; }
          return data;
        };
        Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { get: function () { return 4; }, configurable: true });
        Object.defineProperty(Navigator.prototype, 'deviceMemory', { get: function () { return 8; }, configurable: true });
      } catch (e) { /* never break the page */ }
    })(${JSON.stringify({ gpc: !!cfg.gpc, fingerprint: cfg.fingerprint, seed: cfg.seed })});`;
    try { webFrame.executeJavaScript(code); } catch (e) { /* frame not ready */ }
  }
}

// ---- login form capture (the user is asked in the window chrome before anything is saved) ----
if (location.protocol === 'https:' || location.protocol === 'http:') {
  document.addEventListener('submit', (event) => {
    try {
      const form = event.target;
      if (!form || !form.querySelector) return;
      const pw = form.querySelector('input[type="password"]');
      if (!pw || !pw.value) return;
      const fields = Array.from(form.querySelectorAll('input')).filter((i) => i !== pw && (i.type === 'text' || i.type === 'email' || i.type === 'tel' || !i.type));
      const user = fields.find((i) => i.value) || null;
      if (!user) return;
      ipcRenderer.send('password:capture', { username: user.value, password: pw.value });
    } catch (e) { /* never interfere with the page */ }
  }, true);
}
