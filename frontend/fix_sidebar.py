import re
import os

replacements_sidebar = {
    "const SIDEBAR_BG = 'rgba(15, 10, 8, 0.98)';": "const SIDEBAR_BG = 'var(--bg-secondary)';",
    "background: 'rgba(15,10,8,0.95)'": "background: 'var(--bg-secondary)'",
    "color: '#a5b4fc'": "color: '#f5550f'",
    "color: '#475569'": "color: 'var(--text-muted)'",
}

with open('src/components/Sidebar.jsx', 'r', encoding='utf-8') as f:
    sidebar_content = f.read()
    
for old, new in replacements_sidebar.items():
    sidebar_content = sidebar_content.replace(old, new)
    
with open('src/components/Sidebar.jsx', 'w', encoding='utf-8') as f:
    f.write(sidebar_content)
    
replacements_layout = {
    "background: 'rgba(18,11,9,0.85)'": "background: 'var(--bg-secondary)'",
    "text-slate-600": "text-[color:var(--text-muted)]",
    "text-slate-700": "text-[color:var(--text-muted)]",
    "text-slate-400": "text-[color:var(--text-muted)]",
}

with open('src/layouts/DashboardLayout.jsx', 'r', encoding='utf-8') as f:
    layout_content = f.read()

for old, new in replacements_layout.items():
    layout_content = layout_content.replace(old, new)
    
with open('src/layouts/DashboardLayout.jsx', 'w', encoding='utf-8') as f:
    f.write(layout_content)
    
print("Sidebar and Navbar fixed!")
