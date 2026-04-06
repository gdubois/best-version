---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish]
classification:
  projectType: web-application
  domain: gaming-entertainment
  complexity: medium
  projectContext: greenfield
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-retrogame-curator-2026-04-04.md
  - _bmad-output/planning-artifacts/brainstorming-session-retrogame-curator-2026-04-04.md
documentCounts:
  productBriefs: 1
  research: 0
  brainstorming: 1
  projectDocs: 0
workflowType: prd
---

# Product Requirements Document - RetroGame Curator

**Author:** BMad
**Date:** 2026-04-04

## Executive Summary

**RetroGame Curator** is a web application that consolidates community-vetted recommendations for playing classic games on modern systems. Retro gaming's renaissance has created demand for reliable guidance on emulator selection, patches, and configurations—yet players currently navigate fragmented, outdated forums and websites to find answers.

The platform delivers a single, trusted answer per game: the best way to play on modern hardware (PC or Android). Users browse 1000+ curated titles, search with intelligent query handling (including Roman numeral conversion), and receive platform-specific recommendations with links to legal resources.

**Target Users:**
- **Veteran Collectors** (30s-40s): Seek portable access to their hardware collection without sacrificing quality
- **New Converts** (20s-30s): Discovered retro gaming through streaming/friends, need trusted guidance without forum intimidation

**Success Metric:** 200-500 active users within 6 months, with 20+ monthly community submissions and weekly newsletter engagement.

### What Makes This Special

**The "Aha!" Moment:** A user searches for "Final Fantasy VII" or "FF7" or "Final Fantasy VII" and instantly sees: "Best way to play: RetroArch with PCSX2 backend on PC, or DuckStation on Android—here are the exact settings and patches."

**Core Differentiators:**
- **Simplicity:** One clear recommendation per game, not a list of options to parse
- **Community-moderated:** Submissions go through approval; quality emerges through upvotes
- **Legal-first:** Only links to legitimate resources; no file hosting
- **Roman numeral intelligence:** "Persona 3" and "Persona III" return the same results
- **Portable + TV coverage:** Platform-specific guidance for both scenarios

**Why Now:** Retro gaming is booming, but information infrastructure hasn't caught up. A modern, community-moderated platform fills this gap.

**Unfair Advantage:** Built by someone with direct use case and passion for retro gaming—this isn't abstract market research, it's solving a real problem the creator experiences daily.

**Future Vision:** Expand to attribute-based game discovery, personalized recommendations based on user activity, and a distributed moderator network as the community grows.

### Project Classification

| Attribute | Value |
|-----------|-------|
| **Project Type** | Web application (Astro + file-based JSON) |
| **Domain** | Gaming / Entertainment / Community |
| **Complexity** | Medium (moderation workflow, search with numeral conversion, community features) |
| **Project Context** | Greenfield (building from scratch) |

## Success Criteria

### User Success

**Core Experience:**
- Users find the "best way to play" answer in under 30 seconds
- Success path: Landing page → Click game OR Search → Game card with recommendation → Done

**Emotional Success:**
- Users feel relief from not having to navigate outdated forums
- Users trust the recommendation enough to follow links and try the suggested setup
- Users feel empowered to contribute their own findings

**Completion Scenarios:**
- Veteran: "I found the exact emulator settings for [game] on my [device]"
- New convert: "I can play [classic game] on my phone without figuring out emulation myself"

### Business Success

**6-Month Targets:**
- **Active Users:** 200-500 registered users
- **Community Health:**
  - 20+ game submissions per month
  - 1 vote per user per month (minimum engagement)
  - Newsletter subscribers: 100+
  - Newsletter open rate: 30%+

**Sustainability:**
- Maintenance effort: < 5 hours/week (single operator)
- Hosting costs: Minimal (file-based, self-hosted on Pi 5)
- No monetization required—passion project viability

### Technical Success

**Performance:**
- Search returns relevant results in < 30 seconds
- Page load time: < 2 seconds
- Zero broken links (moderated submission pipeline)

**Reliability:**
- Site uptime: 95%+ (self-hosted constraints)
- Data integrity: Game metadata updates reflected within 1 hour of approval

**Maintenance:**
- Single operator can manage entire platform
- No database overhead (file-based storage)
- Automated research workflow for initial content population

### Measurable Outcomes

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time-to-answer | < 30 seconds | User testing / analytics |
| Active users (6 months) | 200-500 | Registered accounts |
| Monthly submissions | 20+ | Admin dashboard |
| Monthly votes per user | 1+ | Voting logs (v2.0+) |
| Newsletter subscribers | 100+ | Email list |
| Newsletter open rate | 30%+ | Resend analytics |
| Return visitor rate | 40% monthly | Analytics |

## Product Scope

### MVP - Minimum Viable Product

**Essential Features:**
- **Game Listing:** Browse curated library of 1000+ games
- **Search Functionality:** Case-insensitive, handles Roman numerals (3 ↔ III, 12 ↔ XII)
- **Game Detail Pages:** Title, alternative names, "Best Way to Play" recommendation, links to legitimate resources, platform-specific guidance (TV vs. portable)
- **Submission + Moderation:** User submits → Admin approves → Published

**Launch Requirements:**
- 1000 games with complete recommendations
- Search returns relevant results in < 30 seconds
- Zero broken links (moderated submission pipeline)
- First 50 community submissions reviewed and processed

**Go/No-Go Decision:**
- Site is live and functional
- At least 10 users have engaged (visited + submitted or subscribed)

### Growth Features (Post-MVP)

**v2.0:**
- Voting system (up/down)
- Newsletter signup and delivery
- User accounts (basic profiles)

**v2.1:**
- Advanced filtering (by era, platform, quality metrics)
- Email notifications for approved submissions

### Vision (Future)

**v2.2+:**
- Attribute-based game discovery
- Personalized recommendations based on user activity
- Mobile app (reusing API/data structure)
- Distributed moderator network
- Expand to additional platforms (Steam Deck, iOS)

## User Journeys

### Journey 1: Sarah Discovers Her First Classic Game

**Opening Scene:**
Sarah, 24, just discovered retro gaming through a friend's stream. She's fascinated by Super Mario Bros. but has no NES and doesn't want to buy vintage hardware. She Googles "how to play Super Mario Bros on phone" at 11 PM, frustrated by forum posts from 2015.

**Rising Action:**
She lands on RetroGame Curator. The search bar is clean and simple. She types "Super Mario Bros" — instant results. The game card shows:
- **Best way to play:** "Emulate via RetroArch on Android with bsnes core"
- **Setup guide:** Links to RetroArch Android download, configuration tips
- **Alternative:** "Play on PC: RetroArch with bsnes core, or Mednafen for accuracy"

**Climax:**
She clicks the recommended links, follows the setup guide, and within 30 minutes has the game running on her phone. The controls feel responsive, the graphics are crisp. She's playing a 30-year-old game on her modern phone.

**Resolution:**
Sarah feels empowered. She's part of the retro gaming community without spending hundreds on vintage hardware. She bookmarks the site and checks back weekly for new discoveries.

**This journey reveals:** Search functionality, game detail pages, clear recommendations, resource links.

### Journey 2: Marcus Finds the Perfect Setup for His Collection

**Opening Scene:**
Marcus, 38, has a basement full of NES, SNES, and N64 cartridges. He wants to play on-the-go during his commute but doesn't want to lug around multiple handhelds. He's heard about emulation but is intimidated by technical complexity.

**Rising Action:**
Marcus lands on RetroGame Curator and searches for "Metal Gear Solid" — a game he never got to play as a kid. The search handles his query perfectly. The game card shows:
- **Best for TV:** "PC: PCSX2 with ePSXe, 2x resolution upscale"
- **Best for portable:** "Android: PPSSPP emulator (MGS is PSP, not PS1!)"
- **Patches:** Link to fan translation if needed
- **Config files:** Direct download links for optimal settings

**Climax:**
Marcus realizes MGS is actually a PSP game, not PS1. The platform-specific guidance saves him from confusion. He follows the PPSSPP setup, imports his game files, and plays MGS on his commute. The experience exceeds his expectations.

**Resolution:**
Marcus becomes a community contributor. He submits findings for Metal Gear Solid games he owns, earning recognition. He checks back regularly, contributing his expertise.

**This journey reveals:** Platform-specific guidance, search intelligence, submission workflow, reputation building.

### Journey 3: The Admin Moderates a Submission

**Opening Scene:**
You receive a notification: "New game submission pending review." A user submitted "Castlevania: Symphony of the Night" with emulator recommendations and configuration links.

**Rising Action:**
You open the moderation dashboard. The submission includes:
- Game title and alternative names
- PC recommendation: "RetroArch with Genesis Plus GX"
- Android recommendation: "RetroArch with ProSystem"
- Links to emulator downloads and config presets

You verify the links work, check that recommendations are accurate, and confirm no copyrighted files are being hosted (only emulator software links).

**Climax:**
The submission is complete and accurate. You click "Approve." The game appears on the site, and the user receives a notification: "Your submission was approved and is now live!"

**Resolution:**
The community benefits from your quality control. The game is now discoverable by thousands of users. You've maintained the platform's trustworthiness.

**This journey reveals:** Admin dashboard, moderation workflow, notification system, approval pipeline.

### Journey 4: User Suggests a Missing Game

**Opening Scene:**
A user searches for "Phantasy Star IV" — a classic SEGA Genesis game. No results appear. Instead of leaving frustrated, they see: "Game not found? Suggest it!"

**Rising Action:**
They click the button and fill out a simple form:
- Game title: "Phantasy Star IV"
- Notes: "Released 1993, one of the best RPGs on Genesis"
- Email (optional): for updates

They submit and receive: "Thanks! Your suggestion is pending review."

**Climax:**
Two days later, they receive an email: "Phantasy Star IV has been added! Thanks to your suggestion." They click through and see the complete recommendation with emulator settings.

**Resolution:**
The user feels heard and valued. They're more likely to return and contribute again. The game library grows organically.

**This journey reveals:** Suggestion form, pending status, email notifications, approval workflow.

### Journey 5: The Attacker (Security Testing)

**Opening Scene:**
A bot scans the site looking for vulnerabilities. It tries:
- SQL injection in the search bar
- Automated scraping of game data
- DDoS attack to overwhelm the server

**Defense Mechanisms:**
- **Rate limiting:** Prevent automated scraping
- **hCaptcha:** Block bots on submission forms
- **Input sanitization:** Prevent injection attacks
- **CDN/WAF:** Cloudflare or similar for DDoS protection
- **API authentication:** If you add API endpoints later

**This journey reveals:** Security requirements, bot protection, rate limiting, input validation.

---

### Journey Requirements Summary

| Journey | Capabilities Revealed |
|---------|----------------------|
| Sarah (Discovery) | Search, game listing, detail pages, resource links |
| Marcus (Platform-specific) | Platform tagging, recommendation display, submission workflow |
| Admin (Moderation) | Admin dashboard, approval workflow, notifications |
| User (Suggestion) | Suggestion form, pending status, email notifications |
| Attacker (Security) | Rate limiting, CAPTCHA, input sanitization, CDN/WAF |

### Security Requirements

**Bot Protection:**
- hCaptcha or Cloudflare Turnstile on submission forms (v2.0+)
- Rate limiting on search and API endpoints (v2.0+)
- User-agent filtering for known scrapers (v2.2+)

**Data Protection:**
- Input sanitization on all user inputs
- HTTPS enforcement
- No sensitive data in logs

**Infrastructure:**
- Cloudflare CDN/WAF for DDoS protection (v2.2+)
- Rate limiting: 100 requests/hour per IP for search
- Submission rate limiting: 5 submissions/day per IP

**Future API Security (v2.0+):**
- API key authentication
- Rate-limited access (1000 requests/day per key)
- Read-only access to game data
- Terms of use prohibiting bulk scraping

## Domain-Specific Requirements

### Legal & Compliance

**Copyright:**
- No copyrighted files hosted — only links to legitimate resources
- DMCA takedown process via email (report@retrogamecurator.com)
- Terms of Service: Users grant non-exclusive license to submit content
- Fair use: Game information used for informational/educational purposes

**Privacy Regulations:**
- **GDPR:** UK/EU user data protection (hosted in UK)
- **UK Data Protection Act 2018:** Compliance with local laws
- **Cookie consent:** Banner for analytics tracking
- **Right to deletion:** Users can request data removal via email

**Content Moderation:**
- All user submissions reviewed before publication
- Images must be suitable for all ages (no mature content)
- Game cover images sourced from Wikimedia Commons (CC licenses)
- User contributions filtered for inappropriate language

### Technical Constraints

**Image Sourcing:**
- Game covers pulled from Wikimedia Commons where available
- Fallback: Placeholder art if no Wikimedia image exists
- No user-uploaded images (avoids moderation overhead)
- Image attribution displayed on game detail pages

**Email-Based Communication:**
- DMCA takedown requests via email
- Submission notifications via email
- Newsletter delivery via Resend API
- No user accounts — email is primary identifier

**Data Retention:**
- Approved submissions: Permanent (until game removed)
- Rejected submissions: Deleted after 30 days
- Suggestion form data: Kept until processed (approved/rejected)
- Newsletter unsubscribes: Processed immediately

**Link Management:**
- External links verified during moderation
- Link rot monitoring: Periodic check of critical resources
- Broken link reporting: Users can report via suggestion form

### Integration Requirements

**Email Service:**
- Resend API for newsletter and notifications
- Single admin email for DMCA/complaints
- No third-party email sharing

**Image Hosting:**
- Wikimedia Commons hotlinking or caching
- No local image storage
- Attribution metadata stored with game records

### Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Copyright claims | Only link to legal resources; DMCA process via email |
| Inappropriate submissions | Manual moderation before publication |
| Link rot | Periodic link verification; user reporting mechanism |
| Scraping abuse | Rate limiting, hCaptcha, Cloudflare WAF |
| GDPR non-compliance | UK hosting, clear privacy policy, data deletion on request |
| Image licensing issues | Only use Wikimedia Commons (CC licenses) with attribution |

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. Roman Numeral Search Intelligence**
- Automatic conversion between Arabic numerals and Roman numerals (3 ↔ III, 12 ↔ XII)
- Handles queries like "Final Fantasy VII", "FF7", "Final Fantasy 7" with identical results
- No existing gaming database implements this level of query normalization

**2. Single Best Answer Philosophy**
- Most gaming platforms list multiple emulator options, forcing users to research
- RetroGame Curator delivers one clear, vetted recommendation per game
- Reduces decision fatigue and builds trust through curation

**3. Unofficial Patch Integration**
- Fan translations, HD patches, and unofficial mods are first-class citizens
- Other platforms avoid these due to legal ambiguity
- RetroGame Curator provides neutral, well-sourced information with legal disclaimers

**4. Regular Recommendation Updates**
- Recommendations are not static — they evolve as new emulators, patches, and techniques emerge
- Admin monitors emulator releases and patch developments
- Users get current best practices, not outdated forum wisdom

**5. Accountless Design**
- No user accounts required — email is the only identifier
- Reduces friction for one-time information seekers
- Respects user privacy while still enabling community participation

### Market Context & Competitive Landscape

**Existing Solutions:**
- **EmuDocs / Emulation Guides:** Static documentation, rarely updated
- **Reddit communities:** Fragmented, no single authoritative answer
- **Gaming databases (MobyGames, GameFAQs):** Informational, not prescriptive
- **Emulator sites:** Focus on software, not game-specific guidance

**The Gap:**
No platform combines:
- Dynamic, regularly-updated recommendations
- Community moderation with expert oversight
- Unofficial patch information with legal neutrality
- Simple, accountless access

### Validation Approach

**Early Validation:**
- Launch with 1000 games and measure time-to-answer
- Track submission approval rates (should be >80% for quality submissions)
- Monitor return visitor rate (should exceed 40% monthly)

**Ongoing Validation:**
- Compare recommendations against community feedback
- Track broken link rate (should be near zero)
- Measure newsletter engagement (open rate >30%)

### Risk Mitigation

| Innovation | Risk | Mitigation |
|------------|------|------------|
| Roman numeral search | Doesn't handle all edge cases | Fallback to fuzzy search; community can report issues |
| Single best answer | Wrong recommendation | Admin oversight; user feedback loop; regular updates |
| Unofficial patches | Legal exposure | Link only; no hosting; clear disclaimers; DMCA process |
| Regular updates | Maintenance burden | Prioritize popular games; community can flag outdated content |
| Accountless design | Harder to track users | Email-based notifications; analytics without PII |

## Web Application Specific Requirements

### Project-Type Overview

**RetroGame Curator** is a static web application built with Astro, designed for low-maintenance, high-reliability operation. The architecture prioritizes simplicity, security, and minimal operational overhead.

### Technical Architecture Considerations

**Hosting:**
- Primary: Self-hosted on Raspberry Pi 5 (home deployment)
- Alternative: Cloud hosting (VPS) for better uptime guarantees
- Static site generation — no server-side rendering required
- CDN layer via Cloudflare for global distribution (v2.2+)

**Authentication:**
- MVP: Accountless — email as primary identifier only
- v2.0: Optional user accounts with email magic links (no passwords)
- No OAuth integration required for MVP
- Session management via secure cookies

**Data Storage:**
- Game metadata: File-based JSON in `/games/` directory
- User data: Minimal — email addresses for newsletter only
- Submissions: JSON file with status tracking
- No database required — file system is the database

**API Considerations:**
- Internal API endpoints for search (Astro SSR endpoints)
- No public API for MVP
- v2.0: Read-only public API for game data (rate-limited)
- Email integration via Resend API

**Performance:**
- Static site — near-instant page loads
- Search: In-memory cache with 5-minute TTL
- Image loading: Wikimedia Commons CDN
- Target: < 2 second page load globally

**Deployment:**
- Git-based workflow (GitHub/GitLab)
- CI/CD: Auto-deploy on main branch merge
- Build time: ~30 seconds for full rebuild
- Incremental regeneration for game additions

### Implementation Considerations

**Security:**
- HTTPS enforced via hosting provider (free SSL)
- Input sanitization on all user inputs
- Basic rate limiting via hosting configuration
- No server-side secrets (static site)

**Maintenance:**
- Single operator model
- Weekly maintenance window (~1 hour)
- Automated link checking (monthly)
- Game content updates via file edits or admin dashboard

**Scalability:**
- Static hosting handles traffic spikes naturally
- CDN cache reduces origin requests
- File-based storage scales to ~10,000 games before database needed
- Horizontal scaling via CDN (no server scaling needed)

### Web Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Hosting Provider                             │
│              (Free SSL, Basic Rate Limiting)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Astro Static Site                            │
│                 (Built at deploy time)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     File-Based Storage                          │
│   /games/*.json │ /submissions.json │ /newsletter.json          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                            │
│        Resend (Email) │ Wikimedia (Images)                      │
└─────────────────────────────────────────────────────────────────┘
```

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-Solving MVP — deliver the core value proposition (finding the best way to play retro games) without unnecessary complexity.

**Resource Requirements:** Single operator, < 5 hours/week maintenance, file-based architecture for minimal operational overhead.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Sarah discovers a game and finds the best way to play it
- Marcus finds platform-specific recommendations for his collection
- User suggests a missing game and gets notified when approved

**Must-Have Capabilities:**
- 1000 games with complete recommendations
- Search with case-insensitive matching and Roman numeral conversion
- Game detail pages with TV and portable recommendations
- Submission + moderation workflow
- Newsletter signup (basic Resend integration)
- Basic HTTPS (free SSL via hosting provider)
- Simple rate limiting via hosting configuration

### Post-MVP Features

**Phase 2 (Post-MVP) — v2.0:**
- Voting system (up/down) for community feedback
- User accounts with email magic links
- Automated newsletter delivery
- Email notifications for submission status
- Read-only public API (rate-limited)
- hCaptcha on forms

**Phase 3 (Expansion) — v2.2+:**
- Attribute-based game discovery (era, platform, genre)
- Personalized recommendations based on user activity
- Mobile app (iOS/Android)
- Distributed moderator network
- Advanced filtering and sorting
- Cloudflare CDN/WAF for enhanced security

### Risk Mitigation Strategy

**Technical Risks:**
- Roman numeral search edge cases → Fallback to fuzzy search
- Link rot → Monthly automated checks + user reporting
- Moderation bottleneck → Clear guidelines, spam detection

**Market Risks:**
- Low community engagement → Seed with 1000 quality games, incentivize early contributors
- Legal challenges → Legal-first approach, DMCA process ready via email

**Resource Risks:**
- Single operator constraints → Keep maintenance < 5 hours/week
- Time for updates → Prioritize popular games, community can flag outdated content

## Non-Functional Requirements

### Performance

- NFR-P1: Page loads complete in < 2 seconds on broadband connections
- NFR-P2: Search returns results in < 30 seconds
- NFR-P3: Site handles 100 concurrent users without degradation
- NFR-P4: Static assets load from CDN cache when available

### Security

- NFR-S1: All data transmitted over HTTPS
- NFR-S2: User emails encrypted at rest
- NFR-S3: All user inputs sanitized to prevent injection attacks
- NFR-S4: Rate limiting prevents automated abuse (100 requests/hour per IP)
- NFR-S5: No sensitive data logged
- NFR-S6: Form submissions protected against bot automation (hCaptcha v2.0+)

### Reliability

- NFR-R1: Site uptime target: 95% (self-hosted constraints)
- NFR-R2: Game data backed up weekly
- NFR-R3: Email delivery via redundant provider (Resend)
- NFR-R4: Link rot monitored monthly with user reporting fallback

### Scalability

- NFR-Sc1: File-based storage supports up to 10,000 games without database migration
- NFR-Sc2: CDN layer handles traffic spikes automatically
- NFR-Sc3: Single operator can manage content updates without automation

### Data Privacy

- NFR-D1: GDPR compliance for UK/EU users
- NFR-D2: User data deletion requested within 30 days
- NFR-D3: No third-party data sharing without consent
- NFR-D4: Cookie consent banner for analytics tracking

## Functional Requirements

### Game Content Management

- FR1: Users can browse the complete game library
- FR2: Users can search games by title (case-insensitive)
- FR3: Users can search games using Roman numeral variants (3 ↔ III, 12 ↔ XII)
- FR4: Users can view game detail pages with complete information
- FR5: Users can see platform-specific recommendations (TV vs. portable)
- FR6: Users can view alternative names for games
- FR7: Users can see links to legitimate emulator resources
- FR8: Users can see links to fan translation patches when available
- FR9: Users can report broken or outdated links
- FR10: Admin can approve or reject game submissions

### Search & Discovery

- FR11: System can normalize Roman numeral queries automatically
- FR12: System can return results for partial title matches
- FR13: Users can see game cover images when available
- FR14: System can handle queries with or without platform prefixes (FF7 vs. Final Fantasy VII)

### User Submissions

- FR15: Users can submit new games for inclusion
- FR16: Users can submit updated recommendations for existing games
- FR17: Users can optionally provide their email for submission notifications
- FR18: Users can optionally provide notes with their submission
- FR19: Users receive email notification when submission is approved
- FR20: Users receive email notification when submission is rejected
- FR21: Admin can review submissions with complete details
- FR22: Admin can approve submissions for publication
- FR23: Admin can reject submissions with reason

### Newsletter

- FR24: Users can subscribe to weekly newsletter
- FR25: Users can unsubscribe from newsletter
- FR26: System can deliver weekly newsletter via email
- FR27: Newsletter can include featured games
- FR28: Newsletter can include new game additions
- FR29: Newsletter can include updated game entries
- Admin can curate newsletter content manually

### Moderation & Admin

- FR30: Admin can view pending submissions
- FR31: Admin can view approved games
- FR32: Admin can view rejected submissions
- FR33: Admin can edit game metadata before publication
- FR34: Admin can remove published games
- FR35: Admin can view submission history

### Legal & Compliance

- FR36: System can display Terms of Service
- FR37: System can display Privacy Policy
- FR38: Users can request data deletion via email
- FR39: System can process DMCA takedown requests via email
- FR40: Users grant non-exclusive license to submit content

### Security

- FR41: System can enforce HTTPS
- FR42: System can sanitize all user inputs
- FR43: System can rate-limit search requests
- FR44: System can rate-limit submission requests
- FR45: System can filter inappropriate language in submissions
- FR46: System can block known scraper user-agents (v2.0+)
- FR47: System can display hCaptcha on forms (v2.0+)

### Data Management

- FR48: System can store game metadata in file-based JSON
- FR49: System can store submissions with status tracking
- FR50: System can store newsletter subscribers
- FR51: System can delete rejected submissions after 30 days
- FR52: System can track submission timestamps
- FR53: System can track approval timestamps

<!-- PRD content will be appended sequentially through collaborative workflow steps -->
