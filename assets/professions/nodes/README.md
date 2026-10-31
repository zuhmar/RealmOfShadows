# Island gathering world sprites

Generated glossy cartoon world props, separate from the inventory material icons.
Eight tree species and eight plants follow their native island palettes; six ore
outcrops preserve tier colors. All retain their existing global spawn rules.

Trees use square transparent 256px source frames; herbs, ore and stumps use 128px
frames. Runtime tree dimensions match decorative map tree dimensions (normally
128×192 world pixels). This changes artwork only, not collision or node reach.
Depleted birch uses the white-bark stump; other species use the brown stump.

Sources: `../masters/island-trees.png` and `../masters/island-nodes.png`.
Regenerate exports with `npm run art:gathering-nodes`. Do not run the older
material icon extractor to update these world sprites.
