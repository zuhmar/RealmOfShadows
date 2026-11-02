# Parties, fair rewards and world chat

Chat stays open across the width of the screen below the action dock while playing. The **Party** button opens a separate popup for invitations and members. Online players in your hunting room can be invited; another player's name cannot be entered to impersonate them.

The scrollable channel bar contains **World**, **Server Log**, **Broadcast**, **Trade**, **Help**, **LFG**, and **Party**. The public channels reach every island and room on the current world server. Party chat reaches only current members. Server Log is private and read-only, showing connection messages, travel, action results, reward gains and errors.

The text field remains editable in public channels even while disconnected, so players can compose a draft. Sending requires multiplayer; messages remain in the field until the server confirms delivery. Errors/timeouts retain the draft. Drafts are kept separately for each channel and cleared on logout. Server Log alone has a read-only field. Chat keyboard events stay inside the form, and focusing chat stops queued walking/bot controls so typing cannot trigger game hotkeys. The panel moves above the onscreen keyboard when the mobile visual viewport shrinks. The panel and party controls hide on the login/character screens.

## Party rules

- Up to four members. Invite another online player to create a party; invitations last 60 seconds and require acceptance.
- Joining, leaving and removing members require the involved party to be out of combat, so membership cannot be changed to redirect an ongoing fight’s rewards. Invitations can be sent during combat and accepted afterward.
- Only the leader can invite or remove members. Anyone can leave. When the leader leaves or disconnects, the first remaining member becomes leader.
- Parties and invitations are session-only. Switching characters or disconnecting leaves the party; they do not change account saves.
- Living members within 16 tiles of the kill on the same floor qualify for rewards, including nearby supporting members who did not land a hit. Dead, distant and other-floor members receive nothing.

## Kill ownership and sharing

Combat records actual damage, capped to the monster's remaining HP. Overkill never adds extra contribution. Contributions reset when an encounter leashes and heals, and on death/respawn.

The solo player or party with the greatest combined contribution earns the kill. Equal totals favor the group that first contributed. A fallen member's damage still counts for their surviving nearby party, though the fallen member receives no rewards. A last hit cannot take ownership from a higher-contributing player/group.

The winning party's eligible members split the kill's EXP, gold, pelts and crystal shards. Integer remainders rotate between members. Equipment is rolled once per monster, assigned to the next eligible member in the rotation, and never duplicated. There is no party EXP multiplier. Each eligible member receives full quest/task kill credit for accepted objectives; skill EXP still comes from their own attacks and blocks.

Automatic collection uses the existing private bundle system. Full bags retain their owner's allocated bundle at the kill location for 90 seconds; other party members still receive their own shares. Free space and approach the bundle to recover it automatically. Repeated processing and foreign pickup requests cannot duplicate or steal rewards.

## Chat and identity

World chat uses server-issued guest labels or saved character names. Client-supplied names, sender IDs, Server Log posts, reward amounts and membership claims have no authority. Party messages go only to current party members and never enter public history. Departing a party clears its local conversation. Signing out/switching characters clears social UI state.

Messages are plain text, up to 240 characters, with control characters removed. A per-connection token bucket permits three messages initially and replenishes one every 1.5 seconds. The server retains at most 80 messages per public channel; the client keeps at most 100 entries per channel. History is transient, not stored in Supabase. World delivery spans rooms on this one Node world server; a future multi-process deployment needs a shared chat transport.

## Validation and deployment

- `npm test`: party permissions/invites/capacity/expiry/leadership, damage ownership and reset, conserved rotating shares, full bags, quest/task credit, fallen/other-floor/distant members, private delivery, all public channel IDs, rejected Server Log posts, identity, text validation, shared spam budgets and history limits.
- `TEST_SERVER_URL=ws://localhost:2575 npm run test:party:integration`: real clients, invitations, a shared wolf kill, world delivery across rooms, private party chat and disconnect leadership.
- With Vite pointed at the same server, `TEST_CLIENT_URL=http://localhost:5367 npm run test:party:browser`: desktop plus 390px/320px mobile, permanent panel/dock bounds, separate invitations popup, actual typed keyboard input, all channels, safe text rendering, retained drafts, travel, leave/logout cleanup and editable offline drafts.

Deploy Render and Vercel together. No database migration or new environment variables are required. Existing saved EXP, gold and inventory use their existing save format.
