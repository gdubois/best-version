---
stepsCompleted: []
inputDocuments: []
session_topic: RetroGame Curator - Technical Architecture & Implementation
session_goals: |-
  - Design a modern, reactive web application for game curation
  - Implement file-based storage that supports easy game additions
  - Create automated research workflow using LangChain/LangGraph
  - Support thousands of games with 6 featured games per page load
  - Deploy on Raspberry Pi 5 with external LLM server
  - Ensure mobile-app-ready architecture
techniques_used: []
ideas_generated: []
date: 2026-04-04
---

# Brainstorming Session: RetroGame Curator

## Session Overview

**Topic:** RetroGame Curator - Technical Architecture & Implementation

**Goals:**
- Design a modern, reactive web application for game curation
- Implement file-based storage that supports easy game additions
- Create automated research workflow using LangChain/LangGraph
- Support thousands of games with 6 featured games per page load
- Deploy on Raspberry Pi 5 with external LLM server
- Ensure mobile-app-ready architecture

---

## Technique: Stack Comparison Matrix

### Candidates Evaluated

| Framework | Type | Pi Compatibility | File Watch | Build Size | Learning Curve |
|-----------|------|------------------|------------|------------|----------------|
| **Astro** | Static Site | ✅ Excellent | ✅ Via polling | ⚡ Ultra-light | Low |
| **SvelteKit** | SSR/SSG | ✅ Good | ✅ Native | 🚀 Lightweight | Low |
| **Hono + HTMX** | Micro-framework | ✅ Excellent | ✅ Simple | 📦 Tiny | Medium |
| **FastAPI + HTMX** | Python Backend | ✅ Good | ✅ Easy | 🐍 Moderate | Medium |
| **Next.js (static)** | Static Export | ⚠️ Heavy | ✅ Via polling | 📦 Large | Medium |

### Winner: Astro

**Why Astro is ideal for this project:**

✅ **Content Collections** - Native file-based data management (perfect for JSON game metadata)
✅ **Islands Architecture** - Minimal JavaScript, perfect for Pi 5 resources
✅ **FileSystem Watch** - Auto-rebuilds when new game files are added
✅ **Static Output** - Zero server-side overhead, easy hosting
✅ **TypeScript Support** - Strong typing for JSON schema
✅ **Small Bundle Size** - Fast load times even on older devices
✅ **Easy Maintenance** - Single maintainer friendly

### Alternative: SvelteKit (if dynamic features needed)

If server-side API endpoints are needed (newsletter subscription, game suggestion form), SvelteKit offers:
- Better server-side capabilities
- Still lightweight enough for Pi 5
- Svelte's reactivity is excellent

---

## Technique: Constraint-Based Design

### Challenge 1: Reactivity with File-Based Storage

**Solution: Astro + Incremental Static Regeneration (ISR)**

```
game added/updated → Astro rebuilds only affected pages → REST API cache invalidated
```

**Options:**

| Approach | Reactivity | Complexity |
|----------|-----------|------------|
| **Full rebuild on change** | ~30 seconds | ✅ Low |
| **Incremental regeneration** | ~5 seconds per page | ⚠️ Medium |
| **SSR fallback for game list** | Instant | ✅ Low |

**Recommendation:** Use Astro's **Content Collections** with a file watcher that triggers incremental regeneration. For instant updates, serve the game list via a lightweight SSR endpoint.

### Challenge 2: Client-Side Search via REST API

**Implementation Pattern:**

```
Client → GET /api/search?q=final+fantasy
        → Server reads games/*.json
        → Returns filtered results (cached)
```

**Tech Stack:**
- **Astro SSR endpoints** (`/src/pages/api/search.ts`)
- **In-memory cache** with TTL (5 minutes) to avoid re-scanning JSON on every request
- **Full-text search** using simple string matching or lightweight library like `flexsearch`

### Challenge 3: Pre-Generate Featured Games

**Server-Side Strategy:**

```
Build time: Select 6 random games from games/*.json
Runtime: Serve pre-generated list, regenerate when:
  - New game added
  - Admin triggers refresh
  - Cron job (daily/weekly)
```

**Implementation:**
- Store selected featured games in `/src/data/featured.json`
- Regenerate on file change event
- Cache for session or day

### Challenge 4: Featured Games by Latest Changes

**Updated Strategy:**

Instead of random selection, feature the **6 most recently updated games**:

```typescript
// Sort by file modification time
const games = await getGames();
const featuredGames = games
  .sort((a, b) => new Date(b._file.src).getTime() - new Date(a._file.src).getTime())
  .slice(0, 6);
```

---

## Technique: Search Flexibility Design

### Core Requirements

- **Search fields:** `basic_info.title`, `release.alternative_names`
- **Case insensitive:** "final fantasy" = "FINAL FANTASY"
- **Roman numeral conversion:** "3" ↔ "III", "12" ↔ "XII"
- **No results handling:** Show "Suggest this game" button

### Solution Architecture

#### 1. Numeral Normalization Layer

```typescript
// Roman numeral to decimal conversion
const romanMap: Record<string, number> = {
  'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000,
  'IV': 4, 'IX': 9, 'XL': 40, 'XC': 90, 'CD': 400, 'CM': 900
};

function romanToDecimal(roman: string): number | null {
  const upper = roman.toUpperCase().trim();
  let result = 0;
  let i = 0;
  let valid = true;

  while (i < upper.length) {
    const twoChar = upper.slice(i, i + 2);
    const oneChar = upper[i];

    if (romanMap[twoChar] && i + 2 <= upper.length) {
      result += romanMap[twoChar];
      i += 2;
    } else if (romanMap[oneChar]) {
      result += romanMap[oneChar];
      i++;
    } else {
      valid = false;
      break;
    }
  }

  return valid ? result : null;
}

function decimalToRoman(num: number): string {
  if (num < 1 || num > 99) return '';

  const conversion = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];

  let result = '';
  let n = num;

  for (const [value, numeral] of conversion) {
    while (n >= value) {
      result += numeral;
      n -= value;
    }
  }

  return result;
}
```

#### 2. Search Query Expansion

```typescript
function expandNumeralVariants(text: string): string[] {
  const variants = [normalizeQuery(text)];
  const lower = text.toLowerCase();

  // Match patterns like "persona 3", "ff7", "metal gear solid 3"
  const numberPattern = /(.+?)\s+(\d+|[IVXLCDM]+)(.+)?/i;
  const match = lower.match(numberPattern);

  if (match) {
    const prefix = match[1].trim();
    const num = match[2];
    const suffix = match[3] ? match[3].trim() : '';

    const asDecimal = romanToDecimal(num);
    if (asDecimal !== null) {
      variants.push(`${prefix} ${asDecimal}${suffix ? ' ' + suffix : ''}`);
    }

    const asInt = parseInt(num);
    if (!isNaN(asInt) && asInt >= 1 && asInt <= 99) {
      variants.push(`${prefix} ${decimalToRoman(asInt)}${suffix ? ' ' + suffix : ''}`);
    }

    variants.push(`${prefix}${suffix ? ' ' + suffix : ''}`);
  }

  variants.push(normalizeQuery(text));

  return [...new Set(variants)];
}
```

#### 3. Search Scenarios

| User Query | Generated Variants | Matches |
|------------|-------------------|---------|
| "persona 3" | "persona 3", "persona iii" | Persona 3, Persona III, ペルソナ3 |
| "Persona III" | "persona iii", "persona 3" | Persona 3, Persona III |
| "FF7" | "ff7", "ff vii" | Final Fantasy VII, ファイナルファンタジーVII |
| "Final Fantasy VII" | "final fantasy vii", "final fantasy 7" | Final Fantasy VII, FF7 |
| "MGS3" | "mgs3", "mgs iii" | Metal Gear Solid 3, MGS III |

---

## Technique: User Journey Mapping

### Journey Map: User Suggests a New Game

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Discovery & Suggestion                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  User lands on site → Browses games → Finds missing game                │
│                      ↓                                                  │
│              Clicks "Suggest a Game" button                             │
│                      ↓                                                  │
│          Fills out suggestion form:                                     │
│          - Game title (required)                                        │
│          - Alternative name (optional)                                  │
│          - Email (optional) - for credit                                │
│          - Notes (optional)                                             │
│                      ↓                                                  │
│          Submits → Confirmation message                                 │
│                      ↓                                                  │
│          Game added to: _bmad-output/suggested-games/                   │
│          Status: pending_research                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: Automated Research (LangChain/LangGraph)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Trigger: New suggestion detected (file watch / webhook)                │
│                      ↓                                                  │
│  LangGraph Workflow Starts:                                             │
│                                                                         │
│  [Node 1: Initial Analysis]                                             │
│  - Parse suggested game info                                            │
│  - Check if game already exists (fuzzy title match)                     │
│  - If exists → Notify user, close suggestion                            │
│  - If new → Continue                                                    │
│                      ↓                                                  │
│  [Node 2: Web Search] ← Uses json_prompt.txt                            │
│  - Search forums, wikis, retro gaming sites                             │
│  - Find consensus on best version                                       │
│  - Identify emulators, patches, translations                            │
│                      ↓                                                  │
│  [Node 3: LLM Analysis] ← External beefy server                         │
│  - Synthesize search results                                            │
│  - Determine best play options                                          │
│  - Extract patch/mod URLs                                               │
│  - Validate legal compliance                                            │
│                      ↓                                                  │
│  [Node 4: JSON Generation]                                              │
│  - Populate game_metadata_schema.json                                   │
│  - Flag for human review (if confidence < threshold)                    │
│                      ↓                                                  │
│  [Node 5: Quality Check]                                                │
│  - Validate JSON against schema                                         │
│  - Verify all required fields present                                   │
│  - Check URL validity                                                   │
│                      ↓                                                  │
│  Game moves to: _bmad-output/approved-games/                            │
│  Status: ready_for_review                                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: Human Review (Optional but Recommended)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Admin receives notification: "New game ready for review"               │
│                      ↓                                                  │
│  Admin reviews auto-generated JSON:                                     │
│  - Verifies accuracy                                                    │
│  - Adjusts recommendations if needed                                    │
│  - Approves or requests re-research                                     │
│                      ↓                                                  │
│  If approved:                                                           │
│  - File moved to: games/                                                │
│  - Image added to: images/                                              │
│  - Site rebuild triggered                                               │
│                      ↓                                                  │
│  User who suggested gets notification: "Your suggestion was added!"     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: Site Update & Newsletter                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Astro rebuilds:                                                        │
│  - Featured games (top 6 by last modified)                              │
│  - Game listing page                                                    │
│  - Search index                                                         │
│                      ↓                                                  │
│  Weekly newsletter queue:                                               │
│  - New/updated games added to queue                                     │
│  - Sent every Friday 9 AM to all subscribers                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### State Machine for Game Suggestions

```
pending_submission → research_in_progress → research_complete →
human_review_pending → approved → published

                          ↓ rejected
                     pending_submission (with feedback)
```

---

## Technique: Newsletter Flow Design

### User Journey: Newsletter Subscription

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Discovery & Signup                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  User sees newsletter CTA (footer or dedicated page)                    │
│                      ↓                                                  │
│          Clicks "Subscribe to Weekly Newsletter"                        │
│                      ↓                                                  │
│          Modal/Page appears with:                                       │
│          - Email input field                                            │
│          - Value proposition (weekly featured games)                    │
│                      ↓                                                  │
│          User submits → Email sent with confirmation link               │
│          Status in DB: pending_confirmation                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: Double Opt-In Confirmation                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  User receives email with confirmation link                             │
│                      ↓                                                  │
│  User clicks confirmation link → Email verified                         │
│          Status in DB: confirmed                                        │
│          Added to: newsletter_subscribers collection                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: Weekly Newsletter Delivery (Fridays 9 AM)                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Cron job runs Friday 9 AM:                                             │
│                                                                         │
│  1. Query recent changes:                                               │
│     - Games added/modified in last 7 days                               │
│     - Top 6 featured for this week                                      │
│                                                                         │
│  2. Generate newsletter HTML:                                           │
│     - Week number and date                                              │
│     - 6 featured games (grid with covers)                               │
│     - New additions list                                                │
│     - Updated entries list                                              │
│     - Direct link to site                                               │
│                                                                         │
│  3. Send to all confirmed subscribers                                   │
│                                                                         │
│  4. Log delivery stats:                                                 │
│     - Sent, Opened, Clicked                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Database Schema (File-Based)

**`_bmad-output/newsletter-subscribers.json`:**
```json
[
  {
    "id": "uuid-generated-id",
    "email": "user@example.com",
    "confirmed": false,
    "confirmation_token": "sha256-hash",
    "confirmed_at": null,
    "subscribed_at": "2026-04-04T10:00:00Z",
    "last_newsletter_sent": null,
    "suggestions_count": 0
  }
]
```

### Email Service: Resend

**Why Resend:**
- Simple API, great docs
- Free tier: 3,000 emails/month
- Reliable delivery
- Easy Astro integration

**Environment Variables:**
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
SITE_URL=https://yoursite.com
FROM_EMAIL=noreply@yoursite.com
```

### Data Handling Principles

- **No third-party sharing** - Email data stays on Pi
- **Immediate deletion** - Unsubscribed emails deleted from storage
- **LLM isolation** - No personal data sent to LLM server
- **Double opt-in** - Confirmed subscriptions only

---

## Technique: Nostalgia Trigger Analysis

### Color Palette: CRT Monitor Vibes

```css
--bg-primary: #0d0d15;        /* Deep dark blue-black */
--bg-secondary: #1a1a2e;      /* Slightly lighter */
--accent-primary: #ff0055;    /* Retro pink/magenta */
--accent-secondary: #00ff99;  /* Neon cyan/green */
--text-primary: #e0e0e0;      /* Soft white */
--text-muted: #888899;        /* Muted blue-gray */
```

### Typography

**Headings:**
- **Primary:** `VT323` (Google Fonts) - pixelated but readable
- **Alternative:** `Press Start 2P` - more pixelated

**Body Text:**
- **Primary:** `Inter` or `SF Pro Display` - clean, professional

### Visual Effects

**Subtle CRT Effects:**
```css
/* Scanline overlay */
.scanlines {
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 2px,
    rgba(0, 0, 0, 0.1) 3px
  );
  pointer-events: none;
}

/* Subtle glow on interactive elements */
.glow-hover:hover {
  text-shadow: 0 0 8px currentColor;
  box-shadow: 0 0 12px currentColor;
}
```

### UI Components

**Buttons:**
```css
.retro-button {
  background: var(--accent-primary);
  color: var(--bg-primary);
  font-family: 'VT323', monospace;
  font-size: 1.25rem;
  padding: 0.75rem 1.5rem;
  border: none;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.2s;
}

.retro-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 0 var(--accent-secondary);
}
```

**Cards (Game Cards):**
```css
.game-card {
  background: var(--bg-secondary);
  border: 2px solid transparent;
  border-radius: 0; /* Square, not rounded */
  overflow: hidden;
  transition: border-color 0.2s, transform 0.2s;
}

.game-card:hover {
  border-color: var(--accent-primary);
  transform: translateY(-4px);
}
```

### Mobile-Ready Design

This design is mobile-friendly because:
- Responsive modal (90% width on mobile)
- Large touch targets (minimum 44px)
- Proper input types (`type="email"`)
- No hover-dependent interactions
- CSS variables can be reused in future mobile app

---

## Technique: Game Suggestion Flow

### User Journey: Suggest a Missing Game

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SCENARIO 1: Search Returns No Results                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  User searches "Castlevania Symphony" → No results                      │
│                      ↓                                                  │
│  Display:                                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ No games found matching "Castlevania Symphony"                  │   │
│  │                                                                 │ │
│  │           [💡 Suggest "Castlevania Symphony"]                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                      ↓                                                  │
│  User clicks button → Modal opens                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Form Fields

**Required:**
- Game Title (min 2 characters)

**Optional:**
- Alternative Name (for Japanese titles, regional names)
- Email (valid email format if provided) - for credit & updates
- Additional Notes (any length)

### API Endpoint

**`POST /api/suggest`**
```typescript
{
  "title": "Castlevania Symphony of the Night",
  "alternative_name": "Akumajou Dracula: X-ekki Jigoku no Tsukumori",
  "email": "user@example.com",
  "notes": "Found this on Retropie, needs fan translation for English"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Suggestion submitted successfully!",
  "suggestion_id": "uuid"
}
```

### File Structure

**`_bmad-output/suggested-games.json`:**
```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Castlevania Symphony of the Night",
    "alternative_name": "Akumajou Dracula: X-ekki Jigoku no Tsukumori",
    "email": "user@example.com",
    "notes": "Found this on Retropie, needs fan translation for English",
    "status": "pending",
    "created_at": "2026-04-04T10:00:00Z",
    "updated_at": "2026-04-04T10:00:00Z"
  }
]
```

---

## Technique: Terms & Privacy Policy

### Privacy Policy Key Points

1. **Information We Collect**
   - Only voluntarily provided information
   - Newsletter: email address
   - Game suggestions: title, optional alias, email, notes

2. **No Third-Party Data Sharing**
   - Email data stays on Pi
   - Exception: Resend for email delivery
   - LLM server receives NO personal data

3. **Unsubscribe & Data Deletion**
   - Immediate deletion upon unsubscribe
   - Email removed from data store
   - Suggestion record kept, email stripped

4. **Legal Compliance**
   - GDPR compliant
   - CCPA compliant
   - CAN-SPAM compliant (double opt-in)

### Terms of Service Key Points

1. **Legal Content Commitment**
   - Only link to legal resources
   - Never host copyrighted ROMs/ISOs
   - Users responsible for their own compliance

2. **User Contributions**
   - Non-exclusive license to use suggestions
   - Right to reject any suggestion

3. **Intellectual Property**
   - Site content: protected copyright
   - Game content: property of respective holders
   - Fair use for informational purposes

4. **Third-Party Links**
   - No endorsement of linked sites
   - Right to remove unsafe links

---

## Complete Architecture Blueprint

### Project Structure

```
best_version/
├── _bmad/                           # BMAD methodology artifacts
├── _bmad-output/
│   ├── planning-artifacts/
│   ├── implementation-artifacts/
│   ├── games/                       # Curated game JSON files
│   ├── images/                      # Game cover images
│   ├── suggested-games.json         # User suggestions
│   └── newsletter-subscribers.json  # Subscriber data
├── games/                           # Existing game JSON files (source)
├── images/                          # Existing cover images (source)
├── src/
│   ├── components/
│   │   ├── App.astro                # Root app component
│   │   ├── GameCard.astro           # Individual game card
│   │   ├── FeaturedGames.astro      # 6 featured games
│   │   ├── SearchBar.astro          # Search input + results
│   │   ├── SuggestGameModal.astro   # Game suggestion modal
│   │   ├── Footer.astro             # Site footer
│   │   └── Header.astro             # Site header
│   ├── layouts/
│   │   └── MainLayout.astro         # Main layout template
│   ├── pages/
│   │   ├── index.astro              # Homepage
│   │   ├── games/
│   │   │   ├── index.astro          # All games listing
│   │   │   └── [slug].astro         # Individual game page
│   │   ├── search.astro             # Search results page
│   │   ├── suggest.astro            # Suggest game page
│   │   ├── newsletter/
│   │   │   ├── index.astro          # Newsletter signup
│   │   │   └── unsubscribe.astro    # Unsubscribe page
│   │   ├── terms-of-service.astro   # Terms page
│   │   ├── privacy-policy.astro     # Privacy page
│   │   └── api/
│   │       ├── search.ts            # Search API endpoint
│   │       ├── suggest.ts           # Game suggestion API
│   │       └── newsletter/
│   │           ├── subscribe.ts     # Subscribe endpoint
│   │           ├── confirm.ts       # Confirm subscription
│   │           └── unsubscribe.ts   # Unsubscribe endpoint
│   ├── lib/
│   │   ├── email.ts                 # Resend email service
│   │   ├── database.ts              # File-based data store
│   │   ├── search.ts                # Search utility functions
│   │   └── numeral.ts               # Roman numeral conversion
│   ├── content/
│   │   └── games/                   # Astro Content Collections
│   └── styles/
│       └── globals.css              # Global styles + Tailwind
├── public/
│   ├── robots.txt
│   └── favicon.ico
├── astro.config.mjs
├── tailwind.config.cjs
├── tsconfig.json
└── package.json
```

### Configuration Files

**`package.json`**
```json
{
  "name": "retrogame-curator",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "send-newsletter": "tsx src/tasks/send-weekly-newsletter.ts"
  },
  "dependencies": {
    "astro": "^4.16.0",
    "resend": "^4.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "sharp": "^0.33.0"
  }
}
```

**`.env`**
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
SITE_URL=https://yoursite.com
FROM_EMAIL=noreply@yoursite.com
```

### Deployment on Raspberry Pi 5

**`docker-compose.yml`**
```yaml
version: '3.8'

services:
  retrogame-curator:
    build: .
    ports:
      - "4321:4321"
    volumes:
      - ./_bmad-output/games:/app/games
      - ./_bmad-output/images:/app/images
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - SITE_URL=https://yoursite.com
      - RESEND_API_KEY=${RESEND_API_KEY}
      - FROM_EMAIL=${FROM_EMAIL}
```

**`Dockerfile`**
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 4321

CMD ["npm", "run", "preview"]
```

---

## Implementation Timeline

### Phase 1: Foundation (Week 1)
- Initialize Astro project with TypeScript + Tailwind
- Set up Resend account and configure environment
- Create base layout and global styles
- Implement game content collection

### Phase 2: Core Features (Week 2)
- Build game card component
- Implement homepage with featured games
- Create search functionality with numeral conversion
- Build individual game pages

### Phase 3: User Features (Week 3)
- Implement game suggestion modal and API
- Build newsletter subscription flow
- Add Terms of Service and Privacy Policy pages
- Create footer with links

### Phase 4: Polish & Deploy (Week 4)
- Test all functionality
- Set up Docker deployment on Pi 5
- Configure cron job for Friday 9 AM newsletters
- Launch and monitor

---

## Open Questions (From Product Brief)

1. **Content sourcing:** Which specific online resources will the LLM search for consensus?
2. **Human review:** How involved should human review be for auto-generated game entries?
3. **Image hosting:** Where will game cover images be stored/hosted?
4. **Analytics:** Do we need any analytics tracking?
5. **Mobile app:** When planning the future mobile app, should we design the API with mobile-first in mind?

---

## Summary of Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Framework** | Astro + TailwindCSS | Lightweight, file-based, easy maintenance |
| **Storage** | File-based JSON | Simple, versionable, no database overhead |
| **Search** | Case-insensitive + Roman numerals | Handles common user input variations |
| **Email** | Resend | Simple API, reliable, good free tier |
| **Deployment** | Docker on Pi 5 | Consistent, portable, resource-efficient |
| **Newsletter** | Fridays 9 AM | Weekend prep time for users |
| **Featured Games** | Latest 6 by modification time | Fresh content, reflects activity |
| **Suggestion Form** | Title required, others optional | Low friction, encourages contributions |
| **Privacy** | No third-party sharing, immediate deletion | GDPR/CCPA compliant, user trust |

---

*This brainstorming session was conducted on 2026-04-04 for the RetroGame Curator project.*
