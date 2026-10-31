"""Export isolated world gathering props; bag material icons are intentionally separate."""
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/professions/nodes'
OUT.mkdir(exist_ok=True)

def export(sheet, columns, rows, names):
    atlas = Image.open(ROOT / 'assets/professions/masters' / sheet).convert('RGBA')
    for index, name in enumerate(names):
        x, y = index % columns, index // columns
        sprite = atlas.crop((x*atlas.width//columns, y*atlas.height//rows,
                             (x+1)*atlas.width//columns, (y+1)*atlas.height//rows))
        # Ignore faint atlas glow when measuring bounds, retain antialiasing inside.
        bounds = sprite.getchannel('A').point(lambda a: 255 if a > 32 else 0).getbbox()
        if not bounds:
            raise ValueError(f'Empty sprite: {name}')
        sprite = sprite.crop(bounds)
        size = 256 if name.startswith('tree-') else 128
        sprite.thumbnail((size-16, size-12), Image.Resampling.LANCZOS)
        frame = Image.new('RGBA', (size, size))
        frame.alpha_composite(sprite, ((size-sprite.width)//2, size-4-sprite.height))
        frame.save(OUT / f'{name}.png', optimize=True)

export('island-trees.png', 4, 2, ['tree-'+n+'Log' for n in
       ['oak','birch','crystalroot','mangrove','frostpine','starwood','emberwood','nightwood']])
export('island-nodes.png', 4, 4,
       ['meadowleaf','whisperfern','glowcap','bogbloom','frostmint','sunblossom','ashroot','nightshade',
        'copperOre','ironOre','goldOre','mythrilOre','dragonOre','shadowOre','stump','stump-birch'])
