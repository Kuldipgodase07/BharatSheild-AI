import os

filepath = 'src/index.css'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Clean all the junk at the top up to @import
start_idx = 0
for i, line in enumerate(lines):
    if '@import "tailwindcss"' in line:
        start_idx = i
        break

new_lines = ['@import "tailwindcss";\n'] + lines[start_idx+1:]

# Now insert the correct root variables into @layer base
css_vars = """
  :root {
    --bg-primary: #0d0907;
    --bg-secondary: #0d0907;
    --bg-card: rgba(255, 255, 255, 0.04);
    --bg-card-hover: rgba(255, 255, 255, 0.08);
    --border-card: rgba(255, 255, 255, 0.08);
    --text-main: #ffffff;
    --text-muted: #94a3b8;
    
    --accent-indigo: #f5550f;
    --accent-violet: #ff8a50;
    --accent-rose: #f43f5e;
    --accent-emerald: #10b981;
    --accent-amber: #f59e0b;
    --border-subtle: rgba(255, 255, 255, 0.06);
    --glass-bg: rgba(255, 255, 255, 0.03);
  }

  :root.light {
    --bg-primary: #f8f9fa;
    --bg-secondary: #ffffff;
    --bg-card: #ffffff;
    --bg-card-hover: #f1f5f9;
    --border-card: rgba(0, 0, 0, 0.08);
    --text-main: #0f172a;
    --text-muted: #64748b;
    
    --border-subtle: rgba(0, 0, 0, 0.06);
    --glass-bg: rgba(0, 0, 0, 0.03);
  }
"""

content = "".join(new_lines)

# Remove the old broken :root inside @layer base if it's there
import re
content = re.sub(r':root\s*{[^}]*}', '', content, count=1)

# Ensure body color is text-main
content = content.replace('color: #e2e8f0;', 'color: var(--text-main);')

# Find exactly where to insert our new css_vars (e.g. after box-sizing)
insert_point = 'box-sizing: border-box;\n  }'
content = content.replace(insert_point, insert_point + "\n" + css_vars)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed CSS file.")
