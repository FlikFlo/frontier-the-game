// Injects a visible error overlay and pre-React error catcher into
// the Expo-exported dist/index.html. Runs as a post-export step so
// startup errors are never silent on the deployed page.

import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const htmlPath = path.join(distDir, 'index.html');
if (!fs.existsSync(htmlPath)) {
  console.error('No dist/index.html to patch.');
  process.exit(1);
}

const errorOverlay = `
<style>
  #boot-error {
    position: fixed; inset: 0;
    display: none;
    padding: 16px;
    background: #2a1a1a;
    color: #ffd7d3;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 12px;
    line-height: 1.5;
    white-space: pre-wrap;
    overflow: auto;
    z-index: 9999;
  }
  #boot-error h1 {
    font-family: -apple-system, system-ui, sans-serif;
    color: #ff7a70;
    margin: 0 0 12px 0;
    font-size: 18px;
  }
</style>
<div id="boot-error"><h1>Boot error</h1><pre id="boot-error-msg"></pre></div>
<script>
  (function(){
    var showError = function(msg) {
      try {
        var el = document.getElementById('boot-error');
        var pre = document.getElementById('boot-error-msg');
        if (el && pre) {
          el.style.display = 'block';
          pre.textContent = (pre.textContent ? pre.textContent + '\\n\\n' : '') + msg;
        }
      } catch (_) {}
    };
    window.addEventListener('error', function(e){
      var msg = e && e.error && e.error.stack ? e.error.stack : String(e.message || e);
      showError(msg);
    });
    window.addEventListener('unhandledrejection', function(e){
      var reason = e && e.reason;
      var msg = reason && reason.stack ? reason.stack : String(reason);
      showError('Unhandled promise rejection:\\n' + msg);
    });
  })();
</script>
`;

let html = fs.readFileSync(htmlPath, 'utf8');

// 1) Inject the boot-error overlay once.
if (!html.includes('id="boot-error"')) {
  html = html.replace(/<body>/i, '<body>' + errorOverlay);
}

// 2) Expo's web bundle uses `import.meta`, which is only valid inside module
//    scripts. Promote the main bundle <script> to type="module".
html = html.replace(
  /<script\s+src="([^"]*\/_expo\/static\/js\/web\/[^"]+)"\s+defer>\s*<\/script>/i,
  '<script type="module" src="$1"></script>',
);

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Patched dist/index.html (boot-error + module script).');
