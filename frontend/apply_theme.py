import os
import glob

replacements = {
    # Tailwind classes
    'indigo-300': 'orange-300',
    'indigo-400': 'orange-500',
    'indigo-500': 'orange-600',
    'indigo-600': 'orange-700',
    'violet-300': 'amber-300',
    'violet-400': 'amber-400',
    'violet-500': 'amber-500',
    'violet-600': 'amber-600',
    
    # Hex Colors
    '#6366f1': '#f5550f',
    '#a855f7': '#ff8a50',
    '#818cf8': '#ff8a50',
    '#c084fc': '#ffb27a',
    '#ec4899': '#ff5252',
    
    # RGBA Colors
    'rgba(99,102,241,': 'rgba(245,85,15,',
    'rgba(168,85,247,': 'rgba(255,138,80,',
    
    # Backgrounds Deep Blues to Deep Warm Mochas
    '#07091a': '#0d0907',
    '#04050f': '#080503',
    '#0b0826': '#120b08',
    '#0c0e22': '#140c09',
    'rgba(6, 8, 22,': 'rgba(15, 10, 8,',
    'rgba(6,8,22,': 'rgba(15,10,8,',
    'rgba(7,9,26,': 'rgba(18,11,9,',
    'rgba(4,4,24,': 'rgba(10,6,4,',
    'rgba(8,6,32,': 'rgba(16,9,6,',
    'rgba(15,18,40,': 'rgba(22,14,10,',
    '#1e1145': '#26110a',
    '#0f0c29': '#170a05',
    '#0d0f26': '#160d09',
    '#0a0c20': '#110906',
    
    # Other chart colors (optional, but keep blue to amber)
    '#38bdf8': '#f59e0b',
    '#f471b5': '#f43f5e',
    'rgba(56,189,248,': 'rgba(245,158,11,',
    'rgba(244,113,181,': 'rgba(244,63,94,'
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

# Process all JSX files in src (recursively if needed, but our files are in src/pages, src/components, src/layouts)
files = glob.glob('src/**/*.jsx', recursive=True)
for f in files:
    process_file(f)
