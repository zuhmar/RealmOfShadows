"""Compress the generated 2×4 travel atlas without resizing or changing its layout."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]/'assets/ui/wayfarer'
image=Image.open(root/'island-atlas.png').convert('RGB')
image.save(root/'island-atlas.webp',quality=90,method=6)
print(image.size, (root/'island-atlas.webp').stat().st_size)
