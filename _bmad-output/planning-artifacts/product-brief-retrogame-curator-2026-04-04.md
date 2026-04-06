---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - _bmad-output/planning-artifacts/brainstorming-session-retrogame-curator-2026-04-04.md
  - _bmad-output/planning-artifacts/prd-retrogame-curator.md
date: 2026-04-04
author: BMad
---

# Product Brief: RetroGame Curator

## Executive Summary

**RetroGame Curator** is a community-driven service that helps retro gaming enthusiasts discover the best way to play classic games on modern systems. With retro gaming experiencing a renaissance, players face the challenge of navigating fragmented information across outdated forums and websites to determine optimal play methods for different platforms.

This service consolidates community-vetted recommendations into a single, stable resource—telling users precisely which emulators, patches, and configurations deliver the best experience for playing on TV/computer screens or portable devices like Android phones.

**Success Metric:** A stable community of a few hundred active users contributing findings and curating recommendations.

---

## Core Vision

### Problem Statement

Retro gaming is booming, but finding the best way to play classic games on modern systems requires sifting through fragmented, often obsolete information across multiple forums and websites. Players face uncertainty about:
- Which emulator or software solution works best
- Whether patches (including fan translations) are available and safe
- How to optimize for different platforms (TV vs. portable)
- What constitutes the "best" experience for their needs

### Problem Impact

Gamers waste hours researching, risk downloading unsafe files, and ultimately settle for suboptimal play experiences because there's no trusted, centralized source for retro game recommendations. This friction discourages new players and frustrates veterans.

### Why Existing Solutions Fall Short

- **Forums:** Outdated, fragmented, hard to search
- **Wiki-style sites:** Often incomplete, not maintained
- **Emulator aggregators:** Focus on software, not game-specific guidance
- **No community curation:** Users can't vote on or submit findings

### Proposed Solution

A lightweight, community-moderated platform where:
- Users submit findings on the best way to play specific games
- Community upvotes surface the highest-quality recommendations
- Each game displays a clear "best overall experience" for modern gamers
- Focus on convenience while respecting visual fidelity, performance, and authenticity
- No files hosted—only links to credible, legal resources

### Key Differentiators

- **Community-driven curation:** Real gamers, for real gamers
- **Simplicity first:** Single answer—"this is the best way to play"
- **Moderation ensures quality:** No spam, verified findings
- **Portable + TV covered:** Not just one platform
- **Legal-first approach:** Only links to legitimate resources
- **Built for today's gamers:** Modern systems, not original hardware

---

## Target Users

### Primary Users

**The Veteran Collector**
- **Profile:** 30s-40s, played on original hardware in 80s/90s, now owns PC + Android phone
- **Motivation:** Wants to revisit classics with better convenience, share knowledge with peers
- **Pain Point:** Spent years collecting hardware, now seeks portable access without sacrificing quality
- **Value:** Clear recommendations let them play any classic instantly on any device

**The New Convert**
- **Profile:** 20s-30s, discovered retro gaming through streaming or friends, owns PC + Android
- **Motivation:** Curious about classics, overwhelmed by where to start
- **Pain Point:** No one to ask, forums are intimidating and outdated
- **Value:** Simple, trusted guidance removes the barrier to entry

### Secondary Users

- **Admin/Moderator:** Single operator (initially) managing submissions and quality
- **Influencers:** Gaming content creators who reference the service for recommendations

### User Journey

**Discovery:**
User hears about a classic game → Searches for "how to play [game] on modern system"

**Onboarding:**
Lands on RetroGame Curator → Sees clean game listing → Clicks into game page → Instantly sees "Best Way to Play" recommendation with links

**Core Usage:**
- Browses games by era/platform
- Votes on recommendations (up/down)
- Submits findings when something's missing or outdated
- Builds reputation through quality contributions

**Success Moment:**
"I found the perfect setup for [game] in 30 seconds—no forum diving, just a clear answer"

**Long-term:**
Regular visits for new discoveries, contributing findings, engaging with community votes

---

## Success Metrics

### User Success

**Core Experience:**
- Users find the "best way to play" answer in under 30 seconds
- Success path: Landing page → Click game OR Search → Game card with recommendation → Done

**Engagement Indicators:**
- Newsletter subscription rate (users opting in for weekly updates)
- Return frequency: Users visiting multiple times per month
- Community participation: Voting on recommendations

### Business Objectives

**6-Month Targets:**
- **Active User Base:** 200-500 registered users
- **Community Health:**
  - 20+ game submissions per month
  - 1 vote per user per month (minimum engagement)
  - Weekly newsletter with consistent open rates

**Sustainability Goals:**
- Minimal maintenance effort (single operator)
- Low hosting costs (file-based, no database overhead)
- No monetization required—passion project viability

### Key Performance Indicators

| KPI | Target | Measurement |
|-----|--------|-------------|
| Time-to-answer | < 30 seconds | User testing / analytics |
| Active users (6 months) | 200-500 | Registered accounts |
| Monthly submissions | 20+ | Admin dashboard |
| Monthly votes per user | 1+ | Voting logs |
| Newsletter subscribers | 100+ | Email list |
| Newsletter open rate | 30%+ | Resend analytics |
| Return visitor rate | 40% monthly | Analytics |

---

## MVP Scope

### Core Features

**MVP Must-Haves:**
- **Game Listing:** Browse the curated library of 1000+ games
- **Search Functionality:** Find games by title (case-insensitive, handles Roman numerals)
- **Game Detail Pages:** Each game displays:
  - Title and alternative names
  - "Best Way to Play" recommendation
  - Links to legitimate resources (emulators, patches, configs)
  - Platform-specific guidance (TV vs. portable)

**MVP Content Strategy:**
- Initial 1000 games populated via automated research workflow (LangChain/LangGraph)
- Manual entry for critical titles
- Community submissions go through moderation (submit → approve → publish)

### Out of Scope for MVP

- Voting system (deferred to v2.0)
- Newsletter signup (deferred to v2.0)
- User accounts/reputation system
- Advanced filtering
- Mobile app

### MVP Success Criteria

**Launch Validation:**
- 1000+ games with complete recommendations
- Search returns relevant results in < 30 seconds
- Zero broken links (moderated submission pipeline)
- First 50 community submissions reviewed and processed

**Go/No-Go Decision:**
- Site is live and functional
- At least 10 users have engaged (visited + submitted or subscribed)

### Future Vision

**Post-MVP Enhancements:**
- **v2.0:** Voting system, newsletter, user accounts
- **v2.1:** Advanced filtering (by era, platform, quality metrics)
- **v2.2:** Mobile app (reusing API/data structure)
- **Long-term:** Expand to additional platforms (Steam Deck, iOS), community reputation system

<!-- Content will be appended sequentially through collaborative workflow steps -->
