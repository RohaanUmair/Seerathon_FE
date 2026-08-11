import re

with open("src/app/page.tsx", "r") as f:
    code = f.read()

# 1. AppHeader & BottomNav
header_pattern = r'/\*\* App-like Top Header \*/.*?function BottomNav\(\) \{.*?return \([^)]+\);\s*\}\s*\}'
# wait regex across lines is tricky. I'll just write the exact file manually or use multiple replaces.

# Let's just use string replace on the whole file content.
