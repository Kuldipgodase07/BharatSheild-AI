import os

replacements = {
    '99, 102, 241': '245, 85, 15',
    '168, 85, 247': '255, 138, 80',
    '#6366f1': '#f5550f',
    '#a855f7': '#ff8a50',
    '#ec4899': '#ff5252',
}

filepath = 'src/index.css'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
    
new_content = content
for old, new in replacements.items():
    new_content = new_content.replace(old, new)
    
if new_content != content:
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Updated {filepath}")
