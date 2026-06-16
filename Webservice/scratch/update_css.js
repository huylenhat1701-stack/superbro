const fs = require('fs');
const path = require('path');

const cssPath = path.join('c:', 'New folder (3)', 'superbro', 'Webservice', 'client', 'css', 'style.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Tokens
css = css.replace(
/--primary:\s+#6366f1;[\s\S]*?--transition-slow:\s+0\.5s cubic-bezier\(0\.4, 0, 0\.2, 1\);/m,
`--primary:       #15803d;
  --primary-dark:  #166534;
  --primary-light: #4ade80;
  --accent:        #d97706;
  --accent-dark:   #b45309;
  --success:       #10b981;
  --danger:        #ef4444;
  --warning:       #f59e0b;

  --bg:            #fdfcfb;
  --bg-card:       #ffffff;
  --bg-card2:      #f1f5f9;
  --bg-glass:      rgba(255, 255, 255, 0.85);
  --border:        rgba(0,0,0,0.08);
  --border-hover:  rgba(21,128,61,0.4);

  --text:          #1e293b;
  --text-muted:    #475569;
  --text-dim:      #94a3b8;

  --shadow-sm:     0 2px 8px rgba(0,0,0,0.05);
  --shadow-md:     0 8px 32px rgba(0,0,0,0.08);
  --shadow-lg:     0 24px 64px rgba(0,0,0,0.1);
  --shadow-glow:   0 0 40px rgba(21,128,61,0.15);

  --radius-sm:     8px;
  --radius-md:     14px;
  --radius-lg:     20px;
  --radius-xl:     28px;
  --radius-full:   9999px;

  --transition:    0.25s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 0.5s cubic-bezier(0.4, 0, 0.2, 1);`
);

// Scrollbar
css = css.replace('background: var(--primary)', 'background: var(--primary-light)');

// Navbar
css = css.replace('background: rgba(15, 15, 19, 0.85);', 'background: var(--bg-glass);');
css = css.replace(/#818cf8/g, '#15803d'); // gradient text
css = css.replace(/#f59e0b/g, '#d97706'); // gradient text
css = css.replace('background: rgba(99,102,241,0.15)', 'background: rgba(21,128,61,0.1)');
css = css.replace('background: rgba(99,102,241,0.2)', 'background: rgba(21,128,61,0.15)');

// Hero
css = css.replace(
/background: radial-gradient\(ellipse 80% 50% at 50% -20%, rgba\(99,102,241,0\.3\), transparent\),[\s\S]*?var\(--bg\);/m,
`background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(21,128,61,0.1), transparent),
              radial-gradient(ellipse 60% 40% at 80% 80%, rgba(217,119,6,0.1), transparent),
              var(--bg);`
);

css = css.replace(
/opacity: 0\.4;[\s\S]*?animation-delay: -6s; \}/m,
`opacity: 0.6;
  animation: float 8s ease-in-out infinite;
}
.orb-1 { width: 500px; height: 500px; background: rgba(134, 239, 172, 0.4); top: -200px; left: -100px; }
.orb-2 { width: 400px; height: 400px; background: rgba(253, 230, 138, 0.4); bottom: -150px; right: -100px; animation-delay: -3s; }
.orb-3 { width: 300px; height: 300px; background: rgba(125, 211, 252, 0.3); top: 40%; left: 60%; animation-delay: -6s; }`
);

css = css.replace('background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3);', 'background: rgba(21,128,61,0.1); border: 1px solid rgba(21,128,61,0.2);');
css = css.replace('color: var(--primary-light);', 'color: var(--primary);'); // hero-badge
css = css.replace("content: '🌏';", "content: '🌿';");
css = css.replace('background: linear-gradient(135deg, #15803d 0%, #d97706 60%, #f87171 100%);', 'background: linear-gradient(135deg, var(--primary) 0%, #047857 60%, var(--accent) 100%);');

css = css.replace('box-shadow: 0 8px 20px rgba(99,102,241,0.4);', 'box-shadow: 0 8px 20px rgba(21,128,61,0.3);');
css = css.replace('color: var(--primary-light);', 'color: var(--primary);'); // hero-stat-number
css = css.replace('background: rgba(99,102,241,0.1); color: var(--primary-light);', 'background: rgba(21,128,61,0.1); color: var(--primary);'); // section-tag

// Place Card
css = css.replace('background: linear-gradient(135deg, var(--bg-card2), #2a1a4e);', 'background: linear-gradient(135deg, var(--bg-card2), #cbd5e1);');
css = css.replace('background: linear-gradient(135deg, #1e1b4b, #312e81);', 'background: linear-gradient(135deg, #f1f5f9, #e2e8f0);'); // placeholder
css = css.replace('background: rgba(0,0,0,0.6); backdrop-filter: blur(10px);', 'background: rgba(255,255,255,0.85); backdrop-filter: blur(10px); box-shadow: var(--shadow-sm);'); // card category
css = css.replace('color: var(--accent);', 'color: var(--primary-dark);'); // card category text
css = css.replace('border: 1px solid rgba(245,158,11,0.3);', 'border: 1px solid rgba(0,0,0,0.05);'); // card category border

// Detail Hero
css = css.replace('background: linear-gradient(135deg, #1e1b4b, #312e81);', 'background: linear-gradient(135deg, #f1f5f9, #cbd5e1);'); // detail hero
css = css.replace('background: linear-gradient(to top, rgba(15,15,19,0.95) 0%, rgba(15,15,19,0.3) 50%, transparent 100%);', 'background: linear-gradient(to top, rgba(253,252,251,0.95) 0%, rgba(253,252,251,0.2) 60%, transparent 100%);'); // detail hero overlay
css = css.replace('background: rgba(245,158,11,0.2); color: var(--accent);', 'background: rgba(21,128,61,0.1); color: var(--primary-dark);'); // detail category
css = css.replace('border: 1px solid rgba(245,158,11,0.4);', 'border: 1px solid rgba(21,128,61,0.2);'); // detail category border
css = css.replace('.detail-title {\n  font-family', '.detail-title {\n  color: var(--text);\n  font-family'); // ensure detail title is readable

// Replace some leftover light/dark primary text
css = css.replace(/color: var\(--primary-light\);/g, 'color: var(--primary);');
css = css.replace(/rgba\(99,102,241,0.08\)/g, 'rgba(21,128,61,0.05)'); // stat-card
css = css.replace(/rgba\(99,102,241,0.2\)/g, 'rgba(21,128,61,0.1)'); // stat-card border
css = css.replace(/rgba\(99,102,241,0.15\)/g, 'rgba(21,128,61,0.15)'); // form focus
css = css.replace(/rgba\(99,102,241,0.05\)/g, 'rgba(21,128,61,0.05)'); // upload zone hover
css = css.replace(/rgba\(99,102,241,0.3\)/g, 'rgba(21,128,61,0.2)'); // btn primary shadow
css = css.replace(/rgba\(99,102,241,0.45\)/g, 'rgba(21,128,61,0.35)'); // btn primary hover shadow
css = css.replace(/rgba\(245,158,11,0.3\)/g, 'rgba(217,119,6,0.2)'); // btn accent shadow
css = css.replace(/rgba\(245,158,11,0.45\)/g, 'rgba(217,119,6,0.35)'); // btn accent hover shadow

// Lightbox
css = css.replace('background: rgba(0,0,0,0.95);', 'background: rgba(255,255,255,0.95);');
css = css.replace('color: white; font-size: 2rem; cursor: pointer;', 'color: var(--text); font-size: 2rem; cursor: pointer;');
css = css.replace('background: rgba(255,255,255,0.1);', 'background: rgba(0,0,0,0.05);');

fs.writeFileSync(cssPath, css);
console.log('style.css updated to light/nature theme.');
