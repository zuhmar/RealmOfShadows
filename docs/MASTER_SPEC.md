# REALM OF SHADOWS
## MASTER CODEX DEVELOPMENT PROMPT
### Original 2D Multiplayer Fantasy RPG

**Project:** Realm of Shadows  
**Genre:** Multiplayer Fantasy RPG / MMORPG  
**Platform:** Web Browser, Desktop, and Mobile  
**Art Style:** Flat Glossy 2D Cartoon  
**World:** Shared Mainland + Shared Hunting Regions + Private Dungeon Instances  
**Progression:** Classless, Skill-Based  
**Combat:** Real-Time, Target-Based  
**Movement:** Hybrid Grid-Based with Smooth Animation

---

# 1. PROJECT VISION

Build Realm of Shadows as an original, persistent, multiplayer fantasy RPG.

The game takes conceptual inspiration from classic MMORPGs such as Tibia, particularly their shared worlds, social communities, monster hunting, skill progression, and player-driven economies.

However, Realm of Shadows must NOT be a Tibia clone.

The game must maintain its own identity through:

- Original flat, glossy 2D cartoon artwork.
- Original characters, monsters, equipment, and environments.
- A central social mainland where players gather.
- Shared open-world hunting and gathering regions.
- Private party dungeons and boss encounters.
- Classless character progression.
- Skill-based combat and gathering professions.
- A player-driven economy.
- Smooth animated movement over a grid-based world.
- Accessible gameplay on desktop and mobile.

The objective is to create a living fantasy world where players can socialize, hunt, gather, craft, trade, explore, and continuously develop their characters.

Players should feel that the mainland is their home and the surrounding regions are their adventures.

# 2. DEVELOPMENT REQUIREMENTS

Use Codex to develop the complete application, including client, multiplayer server, database, game systems, interfaces, and supporting infrastructure.

Inspect the existing repository before modifying files.

Preserve any useful existing code and assets.

Do not overwrite or delete user-created sprite sheets.

Do not substitute pixel art for the user's flat glossy cartoon art.

Use temporary geometric placeholders only when assets are missing.

Build all gameplay systems to support future expansion without requiring major rewrites.

Use modular architecture, reusable components, typed interfaces, and configuration-driven content.

Do not attempt to implement every feature in one pass. Follow the development phases defined later in this prompt.

# 3. TECHNOLOGY STACK

## Frontend Game Engine

Use:

- Phaser 3
- TypeScript
- Vite
- HTML5 Canvas / WebGL
- Responsive HTML/CSS UI where appropriate

Phaser handles:

- Character rendering
- Sprite animations
- Tilemap rendering
- Camera movement
- Visual effects
- Input controls
- Client-side prediction
- Remote player interpolation
- Audio playback

## Multiplayer Backend

Use:

- Node.js
- TypeScript
- Colyseus
- WebSockets
- Server-authoritative gameplay

The server controls:

- Player positions
- Movement validation
- Monster AI
- Combat calculations
- Skill progression
- EXP rewards
- Inventory transactions
- Gathering rewards
- Item drops
- Trading
- Dungeon instances
- Character persistence

Never trust client-submitted damage, EXP, gold, or inventory changes.

## Database

Use PostgreSQL with Prisma ORM.

Persist:

- Accounts
- Characters
- Character progression
- Combat skills
- Gathering skills
- Inventory
- Equipment
- Currency
- Crafting recipes
- Quests
- Guilds
- Friends
- Player trades
- Dungeon records

Use database transactions for inventory, currency, and trading operations.

## Deployment

Design for:

- GitHub source control
- Vercel frontend deployment
- Render multiplayer backend deployment
- Managed PostgreSQL database

Provide environment configuration for local development and production.

The game must work locally before deployment.

# 4. WORLD STRUCTURE

Realm of Shadows uses a hybrid world system.

There are three main world types:

1. Shared mainland
2. Shared hunting and gathering regions
3. Private dungeon and boss instances

## 4.1 Elderwood Mainland

Elderwood is the central social hub.

Players return here after hunting, gathering, completing dungeons, or exploring.

The mainland is a safe zone.

No unrestricted PvP is allowed within Elderwood.

Create a persistent shared town containing:

### Town Square
- Central gathering area
- Visible player characters
- Player chat
- Social interactions
- Player inspection
- Party invitations

### Marketplace
- NPC merchants
- Player trading
- Item listings
- Buy and sell transactions
- Item price displays

### Bank
- Gold storage
- Item storage
- Expandable storage capacity
- Secure account-based persistence

### Crafting District
- Blacksmith
- Alchemy station
- Cooking station
- Equipment crafting
- Material processing

### Guild Hall
- Guild creation
- Guild membership
- Guild invitations
- Guild information
- Future guild events

### Adventure Gates
- Entrances to hunting regions
- Region information
- Level recommendations
- Travel interactions

### Additional Mainland Features
- Equipment repair
- Quest NPCs
- Character customization
- Training areas
- Player leaderboards
- Social gathering spaces

The mainland must be navigable, not a static menu.

Players physically move between buildings and interact with NPCs and stations.

If mainland population exceeds room capacity, support multiple shared mainland instances while keeping players connected through global chat, friends, and party systems.

Do not promise unlimited players in a single server room.

# 5. SHARED HUNTING REGIONS

Build the following regions.

## Whispering Woods

Beginner region.

Features:
- Low-level monsters
- Woodcutting
- Basic herbs
- Beginner resources
- Rare forest creatures
- Starter quests

## Crystal Caverns

Mining and underground hunting region.

Features:
- Ore deposits
- Crystals
- Cave monsters
- Mining progression
- Rare mineral resources
- Dungeon entrance

## Murkmire Swamp

Mid-level hunting region.

Features:
- Poison-based monsters
- Herbalism
- Swamp resources
- Environmental hazards
- Rare creatures

## Frostfall Thundra

Advanced frozen region.

Features:
- Strong monsters
- Rare resources
- Ice-themed enemies
- Elite monster encounters
- High-level gathering

## Ember Peaks

Volcanic region.

Features:
- High-tier ore
- Fire-themed monsters
- Rare mining resources
- Environmental hazards
- High-level hunting

## Celestial Realm

Endgame magical region.

Features:
- Powerful magical creatures
- Rare magical resources
- Advanced combat encounters
- Special crafting materials
- Endgame exploration

## Shadow Fortress

High-level dark fantasy region.

Features:
- Elite monsters
- Dangerous hunting grounds
- Rare equipment materials
- Dungeon entrances
- Powerful bosses

All regions must support:

- Shared multiplayer exploration
- Monster respawning
- Gathering nodes
- Loot drops
- Character EXP
- Skill EXP
- Collision maps
- Region transitions
- Persistent character progress

Implement capacity-aware shared region instances when necessary.

# 6. PRIVATE DUNGEON SYSTEM

Create a private instance architecture.

Players may enter dungeons:

- Alone, when permitted
- With parties of up to four players initially

Each party receives a separate dungeon instance.

Dungeon systems must support:

- Party entry
- Monster encounters
- Boss encounters
- Dungeon objectives
- Completion rewards
- Failure conditions
- Dungeon exit and return
- Instance cleanup
- Reconnection handling

Bosses should support:

- Multiple attack patterns
- Telegraph indicators
- Area attacks
- Special mechanics
- Multiple combat phases
- Unique loot tables

Dungeon rewards must be generated and validated by the server.

Support future expansion into larger group encounters.

# 7. CHARACTER SYSTEM

Realm of Shadows uses classless progression.

Do NOT create permanently locked Warrior, Mage, Archer, or other character classes.

Every player begins as an adventurer.

Players develop their abilities through the activities and equipment they use.

A character may become skilled in multiple disciplines.

## Character Attributes

Include:

- Character Level
- Health
- Mana
- Stamina
- Physical Attack
- Magic Power
- Physical Defense
- Magic Resistance
- Movement Speed
- Critical Chance
- Critical Damage
- Attack Speed

Use data-driven formulas.

Avoid hardcoding final balancing values throughout the codebase.

## Character Level

Initial level cap: 100.

Character EXP comes primarily from:

- Monster kills
- Quests
- Dungeon completion
- Special encounters

Leveling increases base character attributes.

Keep character EXP progression separate from individual skill progression.

# 8. COMBAT SKILL SYSTEM

Implement individual combat skills.

Initial skills:

### Swordsmanship
Improves sword damage and unlocks sword abilities.

### Axe Mastery
Improves axe damage and heavy weapon abilities.

### Archery
Improves ranged weapon effectiveness.

### Magic
Improves magical damage and spell effectiveness.

### Defense
Improves defensive performance and blocking.

### Restoration
Improves healing and support abilities.

Initial combat skill cap: 100.

Skills improve through meaningful successful actions.

Prevent EXP farming exploits by applying server-side eligibility checks and anti-abuse rules.

Do not award unlimited skill EXP for attacking harmless or invulnerable targets.

## Skill EXP Formula

Use an initial quadratic progression curve.

Example:

TotalSkillEXP(level) = 100 × level²

Make the progression formula configurable.

Implement automated tests for level requirements and skill rewards.

# 9. GATHERING AND PROFESSION SKILLS

Implement the following initial professions:

- Mining
- Woodcutting
- Fishing
- Herbalism
- Smithing
- Alchemy
- Cooking

Initial profession skill cap: 100.

Gathering systems must support:

- Resource nodes
- Gathering interactions
- Tool requirements
- Skill requirements
- Gathering duration
- Resource rarity
- Skill EXP rewards
- Node depletion
- Respawn timers

Higher gathering skills unlock access to more valuable resources.

Crafting professions use recipes and materials.

Crafting must support:

- Material requirements
- Skill requirements
- Crafting duration
- Resulting items
- Profession EXP
- Server-validated resource consumption

Prevent duplicate gathering rewards and duplicate crafting transactions.

# 10. HYBRID GRID MOVEMENT

The game uses a tile-based logical world with smooth animated character movement.

## Grid Specifications

Logical tile size: 64×64 pixels.

Movement directions: eight.

Base movement speed: four tiles per second.

Diagonal movement speed must be normalized.

Prevent diagonal corner cutting through blocked tiles.

Support:

- Keyboard movement
- Click-to-move
- Touch joystick movement
- Pathfinding
- Terrain collisions
- Entity hitboxes
- Sprinting
- Stamina consumption

## Movement Architecture

Use logical grid navigation with smooth visual interpolation.

The server must validate legal movement and speed.

The client should use prediction and server reconciliation.

Remote players should use interpolation for smooth movement.

Implement A* pathfinding for click-to-move.

Handle blocked destinations and path recalculation.

Players in safe zones should not unnecessarily block each other's movement.

# 11. SPRITE SHEET SYSTEM

The user will supply original flat glossy cartoon sprite sheets.

Do not generate or replace final artwork automatically.

Build a configurable asset-loading system.

## Character Sprite Specifications

Recommended frame size: 128×128 pixels.

Transparent background.

Consistent feet anchor.

Four primary facing directions:

- Down
- Left
- Right
- Up

Support future eight-direction sprite sheets.

## Character Animations

Initial requirements:

- Idle: 4 frames per direction
- Walk: 6 frames per direction
- Run: 6 frames per direction
- Basic Attack: 6 frames per direction
- Spell Cast: 6 frames per direction
- Hit Reaction: 3 frames per direction
- Death: 6 frames

Use animation manifests so frame counts, layout, frame rate, and direction mapping can be adjusted without rewriting the engine.

## Monster Sprites

Recommended normal monster frame size: 128×128 pixels.

Boss frames may use 256×256 pixels or larger.

Support:

- Idle
- Walk
- Attack
- Hit
- Death
- Special ability animations

## Combat Effects

Recommended frame sizes:

- 64×64
- 128×128

Support sword slashes, spell effects, projectiles, impacts, and healing effects.

## Equipment Visuals

Design the rendering system for future equipment layering.

Support:

- Weapons
- Shields
- Armor
- Helmets
- Accessories

Equipment sprites must align correctly with character animations.

Use explicit layer ordering and anchor offsets.

Do not assume all equipment fits every animation without configuration.

# 12. CAMERA SYSTEM

Implement a smooth follow camera.

Features:

- Player-centered tracking
- Smooth interpolation
- Map boundary restrictions
- Configurable zoom
- Responsive viewport
- Desktop and mobile support

UI must remain fixed while the world moves.

Support mobile camera offsets to accommodate controls.

Use rendering depth based on character foot positions and object layer configuration.

Characters should appear behind or in front of environmental objects as appropriate.

# 13. REAL-TIME COMBAT SYSTEM

Combat must be target-based and real-time.

Players select enemies through clicking or tapping.

## Basic Combat

- Target selection
- Target health bars
- Auto-attacks
- Weapon range validation
- Attack cooldowns
- Active abilities
- Spell casting
- Damage indicators
- Hit reactions
- Death animations

Basic attacks automatically repeat when the target is valid and within range.

## Movement During Combat

Players may reposition while fighting.

Certain abilities may restrict movement during casting.

Implement optional chase mode.

Do not force players to chase targets unless enabled.

## Physical Damage

Use the initial formula:

Damage = max(1, floor((WeaponAttack + 0.6 × WeaponSkill) × AbilityMultiplier - 0.5 × TargetDefense))

## Magic Damage

Use a comparable configurable formula based on:

- Spell power
- Magic skill
- Ability multiplier
- Target magic resistance

## Critical Hits

Initial values:

- Base critical chance: 5%
- Base critical multiplier: 1.5×

Equipment and abilities may modify these values.

All combat calculations must be server-authoritative.

# 14. MONSTER AI

Implement reusable monster AI states:

- Idle
- Patrol
- Detect
- Chase
- Attack
- Return to Spawn
- Death
- Respawn

Monster definitions must be data-driven.

Each monster should have:

- Name
- Level
- Health
- Attack
- Defense
- Movement speed
- Aggression range
- Attack range
- Attack speed
- Abilities
- EXP rewards
- Loot table
- Spawn configuration

Support normal, elite, and boss variants.

Implement leash distances to prevent monsters from following players indefinitely.

# 15. INVENTORY AND EQUIPMENT

Create a grid-based inventory system.

Features:

- Item slots
- Stackable items
- Item rarity
- Item tooltips
- Equipment requirements
- Drag-and-drop support
- Mobile-friendly item selection
- Inventory capacity
- Equipment slots

Initial equipment slots:

- Helmet
- Chest
- Legs
- Boots
- Main Hand
- Off Hand
- Necklace
- Ring

Support equipment durability and repairs.

Do not allow invalid equipment combinations.

# 16. LOOT SYSTEM

Monsters drop items based on configurable loot tables.

Item categories:

- Equipment
- Consumables
- Crafting materials
- Quest items
- Currency
- Rare drops

Suggested rarity tiers:

1. Common
2. Uncommon
3. Rare
4. Epic
5. Legendary

Rarity affects drop frequency and potential item properties.

Use server-controlled randomization.

Do not let clients generate their own rewards.

# 17. PLAYER ECONOMY

Implement a gold-based economy.

Features:

- NPC shops
- Player trading
- Marketplace listings
- Bank storage
- Item storage
- Equipment repairs
- Crafting expenses

All trades must be atomic server-side transactions.

Prevent:

- Item duplication
- Negative balances
- Unauthorized item transfers
- Double spending
- Concurrent inventory exploits

Maintain audit records for important economy transactions.

# 18. DEATH AND RESPAWN

On character death:

- Stop combat.
- Play death animation.
- Prevent additional actions.
- Respawn the player at Elderwood or an authorized respawn location.
- Apply equipment durability loss.
- Preserve inventory and equipped items.

Do not implement permanent item loss initially.

For private dungeons:

- Support teammate revives.
- Support full-party defeat.
- Return defeated parties safely.
- Apply dungeon failure rules.

# 19. SOCIAL SYSTEMS

Build the foundation for:

- Local chat
- Global chat
- Private messages
- Friend lists
- Party invitations
- Party management
- Guild membership
- Player inspection
- Player trading

Add basic moderation protections:

- Chat rate limits
- Muting
- Blocking
- Reporting
- Input validation

Guild events and advanced guild systems can be implemented after the initial multiplayer foundation is stable.

# 20. PVP

Elderwood must remain a safe zone.

Initial PvP features:

- Optional player duels
- Designated PvP regions
- Server-authoritative PvP damage
- Clear PvP eligibility rules

Do not enable unrestricted PvP across the entire world.

Advanced PvP systems can be added later.

# 21. USER INTERFACE

Create a modern fantasy RPG interface matching the flat glossy cartoon art direction.

Avoid pixel-art UI styling.

Use clean, readable, polished panels.

Required UI elements:

- Health bar
- Mana bar
- Stamina bar
- EXP bar
- Character level
- Target health bar
- Combat hotbar
- Minimap
- Chat panel
- Inventory
- Equipment panel
- Skills panel
- Quest log
- Party interface
- Settings

## Desktop Controls

WASD / Arrows: Movement

Left Click: Target

Right Click: Move to Location

1–6: Abilities

Space: Attack / Interact

Shift: Sprint

I: Inventory

C: Character

M: Map

Enter: Chat

## Mobile Controls

Use landscape orientation.

Include:

- Virtual joystick
- Attack button
- Ability buttons
- Target selection
- Responsive HUD
- Touch-friendly inventory
- Mobile chat interface
- Adjustable UI scaling

Support touch safe areas and different screen sizes.

# 22. DATABASE DESIGN

Create normalized database models for:

- User
- Character
- CharacterStats
- CharacterSkill
- ItemDefinition
- InventoryItem
- EquipmentSlot
- CurrencyBalance
- ResourceNode
- CraftingRecipe
- Quest
- QuestProgress
- Guild
- GuildMember
- FriendRelationship
- MarketplaceListing
- Trade
- DungeonCompletion

Use migrations.

Implement proper relationships and indexes.

Use unique identifiers for individual item instances.

Do not store critical game economy state only in client memory.

# 23. PROJECT STRUCTURE

Use a monorepo structure similar to:

realm-of-shadows/
- apps/
  - client/
  - server/
- packages/
  - shared/
  - game-data/
- assets/
  - characters/
  - monsters/
  - tilesets/
  - effects/
  - equipment/
  - ui/
- prisma/
- docs/
- tests/

Organize gameplay code by domain.

Separate rendering, game simulation, persistence, and networking.

# 24. DEVELOPMENT PHASES

## Phase 1 — Game Foundation

Build:

- Project structure
- Phaser client
- Colyseus server
- Elderwood test map
- Character rendering
- Sprite manifest loader
- Eight-direction movement
- Smooth animation
- Collision
- Camera
- Desktop controls
- Mobile controls

Acceptance:

A player can enter Elderwood, move smoothly, and interact with the map.

## Phase 2 — Persistent Multiplayer

Build:

- Account authentication
- Character creation
- Character persistence
- Shared player movement
- Player visibility
- Chat
- Server reconciliation
- Reconnection handling

Acceptance:

Two players can log in independently, see one another, move, disconnect, and return with their character progress intact.

## Phase 3 — Combat Foundation

Build:

- One hunting region
- Monster spawning
- Monster AI
- Target selection
- Basic attacks
- Active abilities
- Damage calculations
- Character EXP
- Combat skill EXP
- Loot

Acceptance:

Players can leave Elderwood, hunt monsters, earn EXP, collect loot, and return.

## Phase 4 — Gathering and Crafting

Build:

- Mining
- Woodcutting
- Resource nodes
- Gathering EXP
- Basic crafting
- Inventory materials
- NPC selling

Acceptance:

Players can gather resources and craft useful items.

## Phase 5 — Economy and Social

Build:

- Bank
- Player trading
- Marketplace
- Parties
- Friend lists
- Guild foundations

Acceptance:

Players can securely exchange items and organize groups.

## Phase 6 — Private Dungeons

Build:

- Dungeon instance creation
- Party dungeon entry
- Dungeon monsters
- Boss mechanics
- Completion rewards
- Dungeon failure handling

Acceptance:

A party can complete a private dungeon and receive persistent rewards.

## Phase 7 — World Expansion

Build remaining regions and expand:

- Monsters
- Gathering resources
- Equipment
- Crafting
- Quests
- Dungeons
- Bosses
- PvP
- Social features

## Phase 8 — Production Hardening

Implement:

- Performance optimization
- Load testing
- Security review
- Monitoring
- Error logging
- Backup strategy
- Deployment automation
- Mobile testing
- Multiplayer stress testing

# 25. TESTING REQUIREMENTS

Write automated tests for:

- Movement validation
- Diagonal corner blocking
- Pathfinding
- Collision detection
- Character EXP calculations
- Skill EXP calculations
- Damage calculations
- Combat range checks
- Monster rewards
- Inventory transactions
- Trading transactions
- Gathering rewards
- Dungeon access
- Character persistence

Provide integration tests for multiplayer synchronization.

Test with multiple simultaneous players.

Document known limitations.

# 26. FINAL DEVELOPMENT INSTRUCTIONS

Treat this prompt as the master project specification.

Build Realm of Shadows incrementally.

Prioritize a stable, playable game over implementing every feature immediately.

Do not claim a feature is complete unless it is implemented and tested.

When an art asset is missing, use a temporary placeholder and document the expected sprite sheet format.

Preserve the user's original glossy cartoon art direction.

Keep gameplay data configurable.

Keep the multiplayer server authoritative.

Keep the world architecture expandable.

At the end of each development phase:

1. Summarize completed features.
2. List modified files.
3. Provide local testing instructions.
4. Run available tests and builds.
5. Identify known issues.
6. Recommend the next development phase.

**START NOW WITH PHASE 1 ONLY.**

Inspect the repository, establish the project architecture, and implement a playable Elderwood movement prototype with configurable sprite sheets, hybrid grid movement, camera controls, collisions, and desktop/mobile input.

Do not attempt to build all eight development phases at once.

The final goal is a polished, original, persistent multiplayer fantasy RPG called REALM OF SHADOWS.