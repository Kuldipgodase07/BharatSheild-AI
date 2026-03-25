import os
import glob
import re

replacements = {
    # Inline Backgrounds
    "'rgba(255,255,255,0.04)'": "'var(--bg-card)'",
    "'rgba(255,255,255,0.03)'": "'var(--bg-card)'",
    "'rgba(255,255,255,0.025)'": "'var(--bg-card)'",
    "'rgba(255,255,255,0.05)'": "'var(--bg-card-hover)'",
    "'#0d0907'": "'var(--bg-primary)'",
    "'#120b08'": "'var(--bg-secondary)'",
    
    # Inline Borders
    "'1px solid rgba(255,255,255,0.08)'": "'1px solid var(--border-card)'",
    "'1px solid rgba(255,255,255,0.07)'": "'1px solid var(--border-card)'",
    "'1px solid rgba(255,255,255,0.06)'": "'1px solid var(--border-card)'",
    "'1px solid rgba(255,255,255,0.1)'": "'1px solid var(--border-card)'",
    "'1px solid rgba(255,255,255,0.05)'": "'1px solid var(--border-card)'",
    
    # Tailwind Text Colors
    'text-white': 'text-[color:var(--text-main)]',
    'text-slate-200': 'text-[color:var(--text-main)]',
    'text-slate-300': 'text-[color:var(--text-main)]',
    'text-slate-400': 'text-[color:var(--text-muted)]',
    'text-slate-500': 'text-[color:var(--text-muted)]',
    
    # Specific fix to keep button text white on colored buttons
    'text-[color:var(--text-main)] transition-all': 'text-white transition-all',
    
    # Backgrounds in Tailwind
    'bg-[#0d0907]': 'bg-[var(--bg-primary)]',
    'bg-[#120b08]': 'bg-[var(--bg-secondary)]',
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)
        
    new_content = new_content.replace('className="w-full text-[color:var(--text-main)] bg', 'className="w-full text-white bg')
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

files = glob.glob('src/**/*.jsx', recursive=True)
for f in files:
    process_file(f)

# Also update index.css
css_vars = """
:root {
  --bg-primary: #0d0907;
  --bg-secondary: #0d0907;
  --bg-card: rgba(255, 255, 255, 0.04);
  --bg-card-hover: rgba(255, 255, 255, 0.08);
  --border-card: rgba(255, 255, 255, 0.08);
  --text-main: #ffffff;
  --text-muted: #94a3b8;
}

:root.light {
  --bg-primary: #f8f9fa;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --bg-card-hover: #f1f5f9;
  --border-card: rgba(0, 0, 0, 0.08);
  --text-main: #0f172a;
  --text-muted: #64748b;
}
"""

with open('src/index.css', 'r', encoding='utf-8') as f:
    css_content = f.read()

if ':root.light' not in css_content:
    with open('src/index.css', 'w', encoding='utf-8') as f:
        f.write(css_vars + "\\n" + css_content.replace('--bg-primary: #0d0907;', '').replace('--bg-secondary: #120b08;', ''))
