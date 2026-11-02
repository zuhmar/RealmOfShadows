# Shared Wayfarer portal appearance

Every surface travel portal uses Elderwood's existing stationary violet electrical
animation, rendered by `drawVillagePortal` in `apps/client/src/village-portal.ts`.
The image, glow, label and click target are centered at `portalFor(region)`.
Images and hit targets are exactly one 64×64 world cell. Authored map objects use
a matching 48×48 source footprint. The editor shows the same one-cell artwork in
its map and prop palette previews.

The old large static portal sprites are skipped during world rendering. Their
source assets remain in the repository. Upper-floor views retain a matching
portal below, without adding a travel interaction on those floors. Lower floors
continue to use stairs. Travel destinations, validation, arrival positions and
sanctuary ranges are unchanged.

No SQL migration is needed. Deploy the client; the shared authored prop metadata
also updates in the server build without changing collision.

Checks: `npm run build`, `npm test`, and
`TEST_CLIENT_URL=http://localhost:5366 npm run test:woods-portal:browser`.
The browser check exercises real portal taps and travel on Elderwood, Whispering
Woods, Crystal Caverns and Murkmire on desktop/mobile, plus upper/lower visibility.
