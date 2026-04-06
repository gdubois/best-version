---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# RetroGame Curator - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for RetroGame Curator, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**Game Content Management:**
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

**Search & Discovery:**
- FR11: System can normalize Roman numeral queries automatically
- FR12: System can return results for partial title matches
- FR13: Users can see game cover images when available
- FR14: System can handle queries with or without platform prefixes

**User Submissions:**
- FR15: Users can submit new games for inclusion
- FR16: Users can submit updated recommendations for existing games
- FR17: Users can optionally provide their email for submission notifications
- FR18: Users can optionally provide notes with their submission
- FR19: Users receive email notification when submission is approved
- FR20: Users receive email notification when submission is rejected
- FR21: Admin can review submissions with complete details
- FR22: Admin can approve submissions for publication
- FR23: Admin can reject submissions with reason

**Newsletter:**
- FR24: Users can subscribe to weekly newsletter
- FR25: Users can unsubscribe from newsletter
- FR26: System can deliver weekly newsletter via email
- FR27: Newsletter can include featured games
- FR28: Newsletter can include new game additions
- FR29: Newsletter can include updated game entries
- FR30: Admin can curate newsletter content manually

**Moderation & Admin:**
- FR31: Admin can view pending submissions
- FR32: Admin can view approved games
- FR33: Admin can view rejected submissions
- FR34: Admin can edit game metadata before publication
- FR35: Admin can remove published games
- FR36: Admin can view submission history

**Legal & Compliance:**
- FR37: System can display Terms of Service
- FR38: System can display Privacy Policy
- FR39: Users can request data deletion via email
- FR40: System can process DMCA takedown requests via email
- FR41: Users grant non-exclusive license to submit content

**Security:**
- FR42: System can enforce HTTPS
- FR43: System can sanitize all user inputs
- FR44: System can rate-limit search requests
- FR45: System can rate-limit submission requests
- FR46: System can filter inappropriate language in submissions
- FR47: System can block known scraper user-agents (v2.0+)
- FR48: System can display hCaptcha on forms (v2.0+)

**Data Management:**
- FR49: System can store game metadata in file-based JSON
- FR50: System can store submissions with status tracking
- FR51: System can store newsletter subscribers
- FR52: System can delete rejected submissions after 30 days
- FR53: System can track submission timestamps
- FR54: System can track approval timestamps

**Total: 54 Functional Requirements**

### Non-Functional Requirements

**Performance:**
- NFR-P1: Page loads complete in < 2 seconds on broadband connections
- NFR-P2: Search returns results in < 30 seconds
- NFR-P3: Site handles 100 concurrent users without degradation
- NFR-P4: Static assets load from CDN cache when available

**Security:**
- NFR-S1: All data transmitted over HTTPS
- NFR-S2: User emails encrypted at rest
- NFR-S3: All user inputs sanitized to prevent injection attacks
- NFR-S4: Rate limiting prevents automated abuse (100 requests/hour per IP)
- NFR-S5: No sensitive data logged
- NFR-S6: Form submissions protected against bot automation (hCaptcha v2.0+)

**Reliability:**
- NFR-R1: Site uptime target: 95% (self-hosted constraints)
- NFR-R2: Game data backed up weekly
- NFR-R3: Email delivery via redundant provider (Resend)
- NFR-R4: Link rot monitored monthly with user reporting fallback

**Scalability:**
- NFR-Sc1: File-based storage supports up to 10,000 games without database migration
- NFR-Sc2: CDN layer handles traffic spikes automatically
- NFR-Sc3: Single operator can manage content updates without automation

**Data Privacy:**
- NFR-D1: GDPR compliance for UK/EU users
- NFR-D2: User data deletion requested within 30 days
- NFR-D3: No third-party data sharing without consent
- NFR-D4: Cookie consent banner for analytics tracking

**Total: 21 Non-Functional Requirements**

### Additional Requirements

From Architecture document:
- Astro + Tailwind CSS starter template
- Docker containerized deployment with nginx-alpine
- File-based JSON storage in `/games/*.json` and `/submissions/*.json`
- In-memory search with Roman numeral conversion
- Resend API for email (newsletter and notifications)
- Wikimedia Commons for game cover images
- CI/CD via GitHub Actions for automated deployments
- Self-hosted on Raspberry Pi 5 or VPS
- No authentication required for MVP
- Admin dashboard for moderation

### UX Design Requirements

**Design System:**
- UX-DR1: Implement Tailwind CSS custom color palette (dark theme with retro accents)
- UX-DR2: Implement typography system (system sans-serif stack, specific type scale)
- UX-DR3: Implement 8px spacing grid with responsive breakpoints
- UX-DR4: Ensure WCAG AA accessibility compliance (contrast, focus states, keyboard nav)

**Components:**
- UX-DR5: Game Card component with cover art, title, platform badges
- UX-DR6: Platform Badge component (TV vs Portable indicators)
- UX-DR7: Platform Selector Tabs component for game detail pages
- UX-DR8: Recommendation Box component with "Best Way to Play" display
- UX-DR9: Search Bar component with prominent homepage placement
- UX-DR10: Empty State component with "Suggest this game" CTA
- UX-DR11: Submission Form component with validation and hCaptcha

**Visual Design:**
- UX-DR12: Dark theme background (#0a0a0a, #111111)
- UX-DR13: Accent colors (Neon Green #00ff88, Electric Purple #9d4edd, Warm Amber #ffaa00)
- UX-DR14: Responsive design (mobile-first: 320px, 768px, 1024px, 1280px breakpoints)
- UX-DR15: Touch targets minimum 44x44px on mobile

**Interactions:**
- UX-DR16: Roman numeral search working flawlessly (automatic conversion)
- UX-DR17: Platform distinction visually immediate (TV vs Portable tabs)
- UX-DR18: Hover states and micro-interactions for desktop
- UX-DR19: Loading states with skeleton screens
- UX-DR20: Success/error feedback patterns with toast notifications

**Total: 20 UX Design Requirements**

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | Browse game library |
| FR2-FR3 | Epic 1 | Search with Roman numeral support |
| FR4-FR8 | Epic 1 | Game detail pages with recommendations |
| FR11-FR14 | Epic 1 | Search normalization and results |
| FR10 | Epic 2 | Admin approve/reject submissions |
| FR15-FR23 | Epic 2 | User submissions + admin moderation |
| FR24-FR30 | Epic 3 | Newsletter subscription and delivery |
| FR37-FR41 | Epic 4 | Legal pages and compliance |
| FR42-FR48 | Epic 5 | Security features |
| FR49-FR54 | Epic 6 | Data management infrastructure |
| NFR-P1-P4 | Epic 6 | Performance requirements |
| NFR-S1-S6 | Epic 5 | Security requirements |
| NFR-R1-R4 | Epic 6 | Reliability requirements |
| NFR-Sc1-Sc3 | Epic 6 | Scalability requirements |
| NFR-D1-D4 | Epic 4 | Data privacy requirements |
| UX-DR2-UX-DR20 | Epic 7 | Design system and UX requirements |
| UX-DR1 | Epic 6 | Design tokens configuration |

## Epic List

### Epic 1: Game Discovery & Search
Users can instantly find any retro game and see the best way to play it on their device
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR11, FR12, FR13, FR14

### Epic 2: Community Submissions & Moderation
Users can contribute new games or updates, and admins can manage content quality through an approval workflow
**FRs covered:** FR10, FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR31, FR32, FR33, FR34, FR35, FR36

### Epic 3: Newsletter & Engagement
Users can subscribe to receive curated game content and stay updated with new additions
**FRs covered:** FR24, FR25, FR26, FR27, FR28, FR29, FR30

### Epic 4: Legal & Compliance
Users can trust the platform operates legally and their data is protected under GDPR
**FRs covered:** FR37, FR38, FR39, FR40, FR41, NFR-D1, NFR-D2, NFR-D3, NFR-D4

### Epic 5: Security & Rate Limiting
Users can interact safely with the platform, protected from abuse and automated attacks
**FRs covered:** FR42, FR43, FR44, FR45, FR46, FR47, FR48, NFR-S1, NFR-S2, NFR-S3, NFR-S4, NFR-S5, NFR-S6

### Epic 6: Platform Reliability & Performance
Users experience a fast, reliable platform with consistent deployments and data protection
**FRs covered:** FR49, FR50, FR51, FR52, FR53, FR54, UX-DR1, NFR-P1, NFR-P2, NFR-P3, NFR-P4, NFR-R1, NFR-R2, NFR-R3, NFR-Sc1, NFR-Sc2, NFR-Sc3

### Epic 7: UX Design System
Users experience a consistent, accessible, and delightful interface across all devices
**FRs covered:** UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR6, UX-DR7, UX-DR8, UX-DR9, UX-DR10, UX-DR11, UX-DR12, UX-DR13, UX-DR14, UX-DR15, UX-DR16, UX-DR17, UX-DR18, UX-DR19, UX-DR20

<!-- Story content follows the template structure below -->

## Epic 1: Game Discovery & Search

Users can instantly find any retro game and see the best way to play it on their device

### Story 1.1: Homepage with Search Bar

As a retro gaming enthusiast,
I can land on a clean homepage with a prominent search bar,
So that I can immediately search for any game I want to play.

**Acceptance Criteria:**

**Given** I land on the homepage
**When** I see the page
**Then** I should see a prominent, centered search bar with placeholder text "Search for a game (e.g., 'Final Fantasy VII')"

**And** the search bar should be keyboard focusable and ready for input

**And** the search bar should have a clear label for screen readers

**And** the search bar should be responsive and work on mobile devices

**And** the design should match the dark theme with retro accents (UX-DR9, UX-DR12)

### Story 1.2: Search Results with Game Cards

As a user searching for games,
I see search results displayed as game cards with cover art and platform badges,
So that I can quickly identify games and see which platforms they support.

**Acceptance Criteria:**

**Given** I have entered a search query and received results
**When** the results are displayed
**Then** each result should be a game card showing cover art, game title, and platform badges

**And** platform badges should clearly indicate "TV", "Portable", or both (UX-DR5, UX-DR6)

**And** game cards should be clickable and navigate to the game detail page

**And** cover art should be loaded from Wikimedia Commons or a placeholder

**And** cards should be responsive (1 column mobile, 2 columns tablet, 4 columns desktop)

**And** hover states should provide visual feedback (lift effect, shadow increase)

### Story 1.3: Game Detail Page

As a user who clicked a game,
I view a complete game detail page with platform-specific recommendations,
So that I can see the best way to play this game on my specific device.

**Acceptance Criteria:**

**Given** I clicked on a game card from search or listing
**When** the game detail page loads
**Then** I should see the game title, cover art, and alternative names

**And** I should see a "Best Way to Play" section at the top with platform selector tabs (TV / Portable)

**And** the platform selector should show TV and Portable as tabbed options (UX-DR7, UX-DR17)

**And** each platform section should display the recommended emulator, version, and configuration

**And** resource links should be categorized (emulator download, config presets, patches)

**And** the page should load within 2 seconds (NFR-P1)

### Story 1.4: Roman Numeral Search Intelligence

As a user searching for games,
I can search using any numeral variant (FF7, Final Fantasy 7, Final Fantasy VII) and get identical results,
So that I don't need to know which numeral format is "correct".

**Acceptance Criteria:**

**Given** I enter a search query containing Roman numerals (e.g., "Final Fantasy VII")
**When** the search is processed
**Then** the system should normalize Roman numerals to a standard format internally

**And** searching "FF7", "Final Fantasy 7", and "Final Fantasy VII" should return identical results

**And** the system should handle common Roman numerals (I through XII at minimum)

**And** the search should be case-insensitive

**And** partial matches should be supported (e.g., "Metal Gear Solid" finds "Metal Gear Solid: Peace Walker")

**And** the normalized query should be reflected in the search results display (FR11, FR12, FR14, UX-DR16)

### Story 1.5: Game Resource Links

As a user viewing a game detail page,
I see links to legitimate emulator resources, fan translation patches, and configuration files,
So that I can follow trusted links to set up the game properly.

**Acceptance Criteria:**

**Given** I am on a game detail page
**When** I view the recommendation section
**Then** I should see categorized resource links

**And** links should be categorized as: Emulator Download, Config Presets, Unofficial Patches, Additional Resources

**And** all emulator download links should point to legitimate, official sources

**And** unofficial patches should have a warning indicator (amber accent) (UX-DR13)

**And** each link should have a clear label describing what it is

**And** links should open in a new tab to keep the detail page open

**And** broken links should be reportable by users (FR9)

### Story 1.6: Empty State Handling

As a user searching for a game,
I see a helpful "game not found" state with a suggestion CTA,
So that I know the game isn't in the database and can contribute it.

**Acceptance Criteria:**

**Given** I searched for a game that doesn't exist in the database
**When** no results are found
**Then** I should see an empty state with an icon and "Game not found" message

**And** the empty state should include a prominent "Suggest this game" button (UX-DR10)

**And** the message should be friendly and encourage contribution

**And** the suggestion button should navigate to the submission form with the search term pre-filled

**And** the empty state should be accessible and properly labeled for screen readers

**And** the design should match the overall theme (dark background, retro accents)

## Epic 2: Community Submissions & Moderation

Users can contribute new games or updates, and admins can manage content quality through an approval workflow

### Story 2.1: Submission Form

As a retro gaming enthusiast,
I can submit new games or updates with recommendations,
So that the community library can grow with my contributions.

**Acceptance Criteria:**

**Given** I am on the submission page
**When** I see the form
**Then** I should see fields for: game title (required), alternative names (optional, comma-separated), platform selection (TV, Portable checkboxes)

**And** I should see fields for emulator recommendations with emulator name, version, and config link

**And** I should see an optional notes field for additional context

**And** I should see an optional email field for submission notifications

**And** the form should have client-side validation (title required, at least one platform selected, at least one recommendation)

**And** the form should include hCaptcha or similar bot protection (FR48, UX-DR11)

**And** the form should be responsive and mobile-friendly

**And** submission should be rate-limited to 5 submissions/day per IP (FR45, NFR-S4)

### Story 2.2: Submission Status & Notifications

As a user who submitted a game,
I receive email notifications when my submission is approved or rejected,
So that I know the status of my contribution.

**Acceptance Criteria:**

**Given** I submitted a game with my email address
**When** an admin approves my submission
**Then** I should receive an email notification: "Your submission was approved and is now live!"

**And** the email should include a link to the published game

**And** when an admin rejects my submission
**Then** I should receive an email notification with the rejection reason

**And** submissions without email should still be processed but without notifications

**And** email delivery should use Resend API as specified in architecture (NFR-R3)

**And** the system should track submission timestamps and approval timestamps (FR53, FR54)

### Story 2.3: Admin Dashboard - Pending Submissions

As an admin,
I can view all pending submissions in a dashboard,
So that I can review and moderate community contributions.

**Acceptance Criteria:**

**Given** I am authenticated as an admin
**When** I access the admin dashboard
**Then** I should see a list of all pending submissions with: game title, submitter email (if provided), submission date, notes

**And** each submission should be clickable to view full details

**And** I should be able to filter submissions by date range

**And** the dashboard should show a count of pending submissions

**And** the dashboard should be accessible only to authenticated admins

**And** admin authentication should use email magic links (v2.0+)

### Story 2.4: Admin Approval/Rejection Workflow

As an admin reviewing a submission,
I can approve it for publication or reject it with a reason,
So that only quality content appears in the game library.

**Acceptance Criteria:**

**Given** I am viewing a pending submission in the admin dashboard
**When** I click approve
**Then** the submission should be added to the games database as a new game record

**And** the submission should be moved to approved status and removed from pending

**And** if the submitter provided an email, they should receive an approval notification

**And** when I click reject
**Then** I should be prompted to enter a rejection reason

**And** the rejection reason should be stored with the submission

**And** if the submitter provided an email, they should receive a rejection notification with the reason

**And** rejected submissions should be deleted after 30 days (FR52)

### Story 2.5: Admin Game Management

As an admin,
I can view approved games, rejected submissions, and submission history,
So that I can manage the game library and maintain quality.

**Acceptance Criteria:**

**Given** I am authenticated as an admin
**When** I access the admin dashboard
**Then** I should be able to view: pending submissions, approved games, rejected submissions

**And** for approved games, I should be able to edit metadata before final publication

**And** I should be able to remove published games from the library

**And** I should be able to view submission history for each game

**And** the admin dashboard should show timestamps for all actions (submission, approval, edits, removal)

**And** game metadata edits should be reflected on the live site within 1 hour (NFR-R3)

**And** the admin interface should follow the same dark theme and design system as the public site (UX-DR1-UX-DR4)

## Epic 3: Newsletter & Engagement

Users can subscribe to receive curated game content and stay updated with new additions

### Story 3.1: Newsletter Subscription

As a retro gaming enthusiast,
I can subscribe to the weekly newsletter,
So that I receive curated game content and updates directly in my inbox.

**Acceptance Criteria:**

**Given** I am on the homepage or footer
**When** I see the newsletter signup section
**Then** I should see an email input field and a "Subscribe" button

**And** the email field should have client-side validation for valid email format

**And** upon successful subscription, I should see a confirmation message

**And** the subscription should be stored in the newsletter subscribers file

**And** unsubscribing should be possible via a link in each newsletter email (FR25)

**And** the subscription form should be rate-limited (FR45)

**And** users should be able to unsubscribe at any time via the link in emails

### Story 3.2: Newsletter Content Curation

As an admin,
I can curate newsletter content manually,
So that I can highlight featured games, new additions, and updates.

**Acceptance Criteria:**

**Given** I am authenticated as an admin
**When** I access the newsletter curation interface
**Then** I should be able to select featured games for the weekly newsletter

**And** I should be able to include new game additions in the newsletter

**And** I should be able to include updated game entries in the newsletter

**And** the newsletter content should be stored for weekly delivery

**And** the admin should be able to preview the newsletter before sending (FR30)

### Story 3.3: Newsletter Delivery

As a newsletter subscriber,
I receive a weekly newsletter with curated game content,
So that I stay engaged with the platform and discover new games.

**Acceptance Criteria:**

**Given** I am subscribed to the newsletter
**When** the weekly newsletter is scheduled for delivery
**Then** the system should send the newsletter via Resend API

**And** the newsletter should include: featured games, new additions, updated entries

**And** each newsletter should have a clear subject line and formatted content

**And** the newsletter should include links to the relevant game pages

**And** email delivery failures should be logged for admin review (NFR-R3)

**And** unsubscribed users should not receive newsletters (FR25)

## Epic 4: Legal & Compliance

Users can trust the platform operates legally and their data is protected under GDPR

### Story 4.1: Terms of Service Page

As a user,
I can view the Terms of Service,
So that I understand my rights and responsibilities when using the platform.

**Acceptance Criteria:**

**Given** I am on any page of the site
**When** I click the "Terms of Service" link in the footer
**Then** I should see a page with the complete Terms of Service content

**And** the Terms should include: user license grant, acceptable use, content guidelines

**And** the page should be accessible and readable

**And** the page should be served over HTTPS (NFR-S1)

**And** the Terms should be clearly dated

### Story 4.2: Privacy Policy Page

As a user,
I can view the Privacy Policy,
So that I understand how my data is collected, used, and protected.

**Acceptance Criteria:**

**Given** I am on any page of the site
**When** I click the "Privacy Policy" link in the footer
**Then** I should see a page with the complete Privacy Policy content

**And** the Privacy Policy should include: data collection, data usage, data retention, user rights

**And** the Privacy Policy should address GDPR compliance for UK/EU users (NFR-D1)

**And** the Privacy Policy should mention cookie consent for analytics tracking (NFR-D4)

**And** the page should be accessible and readable

### Story 4.3: Data Deletion Request

As a user,
I can request my data be deleted via email,
So that I can exercise my right to be forgotten under GDPR.

**Acceptance Criteria:**

**Given** I want my data deleted
**When** I email report@retrogamecurator.com with a deletion request
**Then** the admin should process the request within 30 days (NFR-D2)

**And** the system should track deletion requests and their status

**And** the user's email should be removed from the newsletter subscriber list

**And** any submissions made by the user should be anonymized or deleted

**And** the user should receive confirmation when their data has been deleted

### Story 4.4: DMCA Takedown Process

As a copyright holder,
I can request content removal via email for DMCA violations,
So that I can protect my intellectual property.

**Acceptance Criteria:**

**Given** I have identified copyrighted content on the platform
**When** I email report@retrogamecurator.com with a DMCA takedown request
**Then** the admin should review and process the request according to DMCA guidelines

**And** the platform should respond within the required timeframe

**And** if the content is found to violate copyright, it should be removed

**And** the user who submitted the content should be notified of the takedown

**And** repeat offenders should have their submissions rejected (FR46)

### Story 4.5: Content License Grant

As a user submitting content,
I understand that my submission grants a non-exclusive license to the platform,
So that the content can be published and displayed on the site.

**Acceptance Criteria:**

**Given** I am filling out a submission form
**When** I submit my game recommendation
**Then** the submission should include acknowledgment of the license grant

**And** the Terms of Service should clearly state the non-exclusive license terms

**And** users should be able to see the license terms before submitting

**And** the license should allow the platform to display, modify (for format), and distribute the content

**And** users retain ownership of their original content

## Epic 5: Security & Rate Limiting

Users can interact safely with the platform, protected from abuse and automated attacks

### Story 5.1: HTTPS Enforcement

As a user,
all my interactions with the platform are transmitted over HTTPS,
So that my data is encrypted and secure in transit.

**Acceptance Criteria:**

**Given** I am accessing the site
**When** I navigate to any page
**Then** all connections should be served over HTTPS

**And** the browser should show a secure connection indicator

**And** HTTP requests should be redirected to HTTPS

**And** the hosting provider should provide free SSL certificates (NFR-S1)

**And** HSTS headers should be configured to enforce HTTPS

### Story 5.2: Input Sanitization

As a user submitting content,
all my inputs are sanitized to prevent injection attacks,
So that the platform remains secure from malicious input.

**Acceptance Criteria:**

**Given** I am filling out any form on the platform
**When** I submit my input
**Then** all inputs should be sanitized on the server side

**And** the sanitization should prevent XSS attacks

**And** the sanitization should prevent SQL injection (even though using file-based storage)

**And** the sanitization should prevent command injection

**And** invalid inputs should be rejected with a user-friendly error message (FR43, NFR-S3)

**And** sanitized data should be logged for admin review if suspicious patterns are detected

### Story 5.3: Search Rate Limiting

As a user searching for games,
my search requests are rate-limited to prevent abuse,
So that the platform remains available for all users.

**Acceptance Criteria:**

**Given** I am using the search functionality
**When** I make more than 100 requests per hour from the same IP
**Then** additional requests should be rate-limited with a 429 response

**And** the rate limit should be clearly communicated to users

**And** the rate limit should be enforced at the API level

**And** legitimate users should not be significantly impacted (FR44, NFR-S4)

**And** rate-limited users should see a friendly message about the limit

### Story 5.4: Submission Rate Limiting

As a user submitting games,
my submission requests are rate-limited to prevent spam,
So that the moderation workflow remains manageable.

**Acceptance Criteria:**

**Given** I am using the submission form
**When** I make more than 5 submissions per day from the same IP
**Then** additional submissions should be rate-limited

**And** the rate limit should be enforced per IP address

**And** users should see a message indicating they've reached the daily limit

**And** the rate limiting should be logged for admin review (FR45, NFR-S4)

**And** legitimate users with multiple valid submissions should be able to contact admin for exception

### Story 5.5: Inappropriate Language Filtering

As a user submitting content,
my submissions are filtered for inappropriate language,
So that the platform remains family-friendly.

**Acceptance Criteria:**

**Given** I am filling out a submission form
**When** I submit content with inappropriate language
**Then** the submission should be flagged for admin review

**And** the filter should catch common inappropriate terms

**And** flagged submissions should be clearly marked in the admin dashboard

**And** users should not be explicitly notified of the filter (to avoid bypass attempts)

**And** the admin should be able to manually approve or reject flagged submissions (FR46)

**And** the filter list should be maintainable by admins

### Story 5.6: hCaptcha on Forms

As a user filling out forms,
I am protected from bot automation through hCaptcha,
So that the platform remains secure from automated abuse.

**Acceptance Criteria:**

**Given** I am on a submission form or newsletter signup
**When** I see the form
**Then** hCaptcha should be displayed as a bot protection mechanism

**And** the form cannot be submitted without completing hCaptcha (FR48, NFR-S6)

**And** hCaptcha should be accessible and work with screen readers

**And** hCaptcha should be configured with appropriate difficulty settings

**And** hCaptcha should be integrated with the Resend API for notification emails (v2.0+)

**And** successful hCaptcha completion should be validated server-side

### Story 5.7: Scraper User-Agent Blocking

As a platform operator,
known scraper user-agents are blocked from accessing the site,
So that the platform is protected from automated data scraping.

**Acceptance Criteria:**

**Given** a request comes from a known scraper user-agent
**When** the request hits the server
**Then** the request should be blocked with a 403 response

**And** the list of blocked user-agents should be maintainable (FR47)

**And** legitimate search engine crawlers should not be blocked

**And** blocked requests should be logged for monitoring

**And** this feature is v2.0+ (deferred from MVP)

**And** the blocking should be done at the hosting/CDN level when possible

## Epic 6: Platform Reliability & Performance

Users experience a fast, reliable platform with consistent deployments and data protection

### Story 6.1: Project Initialization

As a developer,
I can initialize the Astro project with Tailwind CSS,
So that I have a solid foundation for building the platform.

**Acceptance Criteria:**

**Given** I am setting up the project
**When** I run `npm create astro@latest` with the blog template
**Then** the project should be initialized with TypeScript strict mode

**And** Tailwind CSS should be configured and working

**And** the project structure should match the architecture specification

**And** the development server should run without errors

**And** the build should complete successfully

**And** the project should be ready for component development

### Story 6.2: Containerized Deployment

As a platform operator,
I can deploy the application consistently using Docker containers,
So that the deployment is reproducible across environments.

**Acceptance Criteria:**

**Given** the project is built
**When** I run `docker-compose up --build`
**Then** the application should start in a Docker container

**And** the Dockerfile should use node:20-alpine as builder

**And** the production image should use nginx:alpine

**And** the Docker Compose should configure volumes for games/ and submissions/ directories

**And** the nginx configuration should include security headers and gzip compression

**And** the container should expose ports 80 and 443

**And** the container should restart automatically on failure

### Story 6.3: Automated Deployment Pipeline

As a platform operator,
I can deploy changes automatically via GitHub Actions,
So that the platform stays up-to-date with minimal manual intervention.

**Acceptance Criteria:**

**Given** I push changes to the main branch
**When** the GitHub Actions workflow runs
**Then** the Docker image should be built and pushed to the container registry

**And** the deployment should automatically update the running container on the server

**And** the workflow should include build and deploy jobs

**And** the deployment should be rollback-able

**And** the workflow should be configurable via environment secrets

**And** successful deployments should trigger notifications (v2.0+)

### Story 6.4: File-Based Data Storage

As a platform operator,
game and submission data is stored in file-based JSON,
So that the platform avoids database complexity while supporting up to 10,000 games.

**Acceptance Criteria:**

**Given** I need to store game data
**When** I write to the games/ directory
**Then** data should be stored as individual JSON files

**And** the games/index.json should maintain a list of all games

**And** each game file should follow the specified schema (title, alternativeNames, platform, recommendations, etc.)

**And** submissions should be stored similarly in the submissions/ directory

**And** file operations should be atomic to prevent corruption

**And** the file structure should scale to 10,000+ games (NFR-Sc1)

### Story 6.5: Data Backup and Recovery

As a platform operator,
game data is backed up weekly,
So that I can recover from data loss.

**Acceptance Criteria:**

**Given** the backup schedule runs weekly
**When** the backup job executes
**Then** the games/ and submissions/ directories should be archived

**And** the backup should be stored securely (separate from production)

**And** the backup process should not impact site availability

**And** backups should be retained for a reasonable period (e.g., 30 days)

**And** the backup restoration process should be documented

**And** backup success/failure should be logged (NFR-R2)

### Story 6.6: Performance Optimization

As a user,
the platform loads quickly and handles concurrent users,
So that I have a smooth experience.

**Acceptance Criteria:**

**Given** I am loading any page
**When** the page loads
**Then** it should complete in under 2 seconds (NFR-P1)

**And** search results should return in under 30 seconds (NFR-P2)

**And** the site should handle 100 concurrent users without degradation (NFR-P3)

**And** static assets should be cached by the CDN (NFR-P4, NFR-Sc2)

**And** image optimization should be configured for fast loading

**And** the single operator can manage content updates without automation (NFR-Sc3)

## Epic 7: UX Design System

Users experience a consistent, accessible, and delightful interface across all devices

### Story 7.1: Design System Configuration

As a user,
I experience a consistent and accessible design across the platform,
So that my interactions feel cohesive and predictable.

**Acceptance Criteria:**

**Given** I am using the platform
**When** I view any page
**Then** the dark theme colors should be consistently applied (#0a0a0a, #111111 for background)

**And** accent colors should be used appropriately (Neon Green #00ff88, Electric Purple #9d4edd, Warm Amber #ffaa00)

**And** semantic colors should be applied correctly (success, warning, info, error)

**And** typography should follow the defined scale (H1 3rem, H2 2rem, H3 1.5rem, Body 1rem, Small 0.875rem)

**And** spacing should follow the 8px base grid system

**And** components should use the defined design tokens consistently (UX-DR1, UX-DR2, UX-DR3)

### Story 7.2: Accessibility Compliance

As a user with disabilities,
the platform is accessible to me,
So that I can use it independently.

**Acceptance Criteria:**

**Given** I am using a screen reader
**When** I navigate the site
**Then** all content should be properly announced with semantic HTML

**And** all interactive elements should have visible focus indicators (2px ring)

**And** color contrast should meet WCAG AA standards (4.5:1 for normal text)

**And** touch targets should be minimum 44x44px on mobile (UX-DR4)

**And** ARIA labels should be provided for icon-only buttons

**And** skip-to-main-content link should be available for keyboard users

**And** the site should pass automated accessibility audits (axe-core, Lighthouse)

### Story 7.3: Game Card Component

As a user browsing games,
I see consistent game cards throughout the platform,
So that I can easily identify and interact with game listings.

**Acceptance Criteria:**

**Given** I am viewing a game listing or search results
**When** I see game cards
**Then** each card should display: cover art, game title, platform badges

**And** the card should have a hover effect (translateY -4px, shadow increase)

**And** the card should be clickable and navigate to the detail page

**And** the card should be responsive (full width on mobile, grid on desktop)

**And** cover art should maintain consistent aspect ratio (3:4 or 16:9)

**And** the component should follow the design system tokens (UX-DR5)

**And** the component should be accessible (alt text for images, keyboard navigable)

### Story 7.4: Platform Badge Component

As a user viewing game information,
I can quickly identify which platforms a game supports,
So that I know if it works on my device.

**Acceptance Criteria:**

**Given** I am viewing a game card or detail page
**When** I see platform badges
**Then** TV should be indicated with a TV icon and green/teal color

**And** Portable should be indicated with a device icon and amber/orange color

**And** both badges should be visible when a game supports both platforms

**And** badges should be small rounded pill shapes

**And** the badges should be consistent across all pages

**And** the component should follow the design system (UX-DR6)

**And** the badges should be accessible (not color-only indication)

### Story 7.5: Platform Selector Tabs

As a user viewing a game detail page,
I can switch between TV and Portable recommendations,
So that I see the setup that works for my specific device.

**Acceptance Criteria:**

**Given** I am on a game detail page
**When** I see the platform selector
**Then** I should see two tabs: TV and Portable

**And** the active tab should be visually indicated

**And** clicking a tab should switch the recommendation content without page reload

**And** the default active tab should be TV (primary platform)

**And** the tabs should be keyboard navigable

**And** the component should follow the design system (UX-DR7, UX-DR17)

**And** the component should be responsive (stacked on mobile, tabs on desktop)

### Story 7.6: Recommendation Box Component

As a user viewing a game detail page,
I see a clear "Best Way to Play" recommendation,
So that I know exactly how to set up the game.

**Acceptance Criteria:**

**Given** I am on a game detail page
**When** I view the recommendation section
**Then** I should see a prominent "Best Way to Play" header

**And** the emulator name should be displayed prominently in monospace font

**And** the version number should be shown if applicable

**And** configuration notes should be included if relevant

**And** resource links should be clearly categorized

**And** unofficial patches should have a warning indicator (amber accent)

**And** the component should follow the design system (UX-DR8)

**And** the component should be accessible and screen-reader friendly

### Story 7.7: Search Bar Component

As a user landing on the homepage,
I see a prominent search bar ready to use,
So that I can immediately search for games.

**Acceptance Criteria:**

**Given** I am on the homepage
**When** I see the search area
**Then** the search bar should be centered and prominent

**And** the placeholder text should be "Search for a game (e.g., 'Final Fantasy VII')"

**And** the search bar should have a clear label for screen readers

**And** the search bar should be keyboard focusable on page load

**And** the search bar should be responsive (full width on mobile, constrained on desktop)

**And** the design should match the dark theme with retro accents (UX-DR9, UX-DR12)

**And** the search bar should have a clear submit action

### Story 7.8: Empty State Component

As a user searching for a game that doesn't exist,
I see a helpful empty state with a suggestion CTA,
So that I know what to do next.

**Acceptance Criteria:**

**Given** my search returned no results
**When** I see the empty state
**Then** I should see an icon/illustration and "Game not found" message

**And** the message should be friendly and encouraging

**And** there should be a prominent "Suggest this game" button

**And** the button should navigate to the submission form with the search term pre-filled

**And** the empty state should be accessible and properly labeled

**And** the design should match the overall theme (UX-DR10)

**And** the empty state should be responsive

### Story 7.9: Submission Form Component

As a user wanting to contribute a game,
I can fill out a submission form with all necessary information,
So that my contribution can be reviewed and published.

**Acceptance Criteria:**

**Given** I am on the submission page
**When** I see the form
**Then** I should see all required fields: game title, platforms, recommendations

**And** optional fields should be clearly marked: alternative names, notes, email

**And** client-side validation should provide immediate feedback

**And** the form should include hCaptcha for bot protection

**And** the form should be responsive and mobile-friendly

**And** the form should follow the design system (UX-DR11)

**And** the form should be accessible (labels, error messages, keyboard navigable)

**And** successful submission should show a confirmation message

### Story 7.10: Dark Theme Implementation

As a user,
the platform uses a dark theme that honors retro gaming culture,
So that the aesthetic feels appropriate and modern.

**Acceptance Criteria:**

**Given** I am using the platform
**When** I view any page
**Then** the background should be dark (#0a0a0a, #111111)

**And** surfaces should be slightly lighter (#1a1a1a, #222222)

**And** text should be high contrast white/light gray

**And** accent colors should be used appropriately (neon green for success, electric purple for brand, warm amber for warnings)

**And** the theme should be consistent across all pages

**And** the theme should be accessible (WCAG AA contrast compliance)

**And** the theme should include subtle retro gaming aesthetics without feeling dated (UX-DR12, UX-DR13)

### Story 7.11: Responsive Design Implementation

As a user on any device,
the platform works well on my screen size,
So that I have a consistent experience whether on mobile, tablet, or desktop.

**Acceptance Criteria:**

**Given** I am accessing the site on any device
**When** I view any page
**Then** the layout should adapt appropriately for my screen size

**And** mobile (320px-767px) should have single-column layouts and stacked elements

**And** tablet (768px-1023px) should have two-column grids and touch-optimized interactions

**And** desktop (1024px+) should have multi-column grids and hover states

**And** the breakpoints should match the design system (UX-DR14)

**And** the mobile-first approach should be followed in CSS

**And** touch targets should be minimum 44x44px on mobile (UX-DR15)

**And** the responsive design should be tested on real devices

### Story 7.12: Roman Numeral Search UX

As a user searching for games,
the Roman numeral search works seamlessly without me knowing the correct format,
So that I get results regardless of how I write the numeral.

**Acceptance Criteria:**

**Given** I am searching for a game with a number in the title
**When** I search using any numeral format
**Then** the search should return identical results for "FF7", "Final Fantasy 7", and "Final Fantasy VII"

**And** the conversion should happen automatically without user intervention

**And** the search should handle common Roman numerals (I through XII)

**And** the UX should feel instant and seamless (UX-DR16)

**And** the feature should be discoverable through use (no explicit explanation needed)

**And** the search results should work correctly for all games with numbers

### Story 7.13: Platform Distinction UX

As a user viewing game recommendations,
I can immediately see whether a game supports TV or Portable play,
So that I know if it works on my device without reading details.

**Acceptance Criteria:**

**Given** I am browsing game listings or viewing a detail page
**When** I see platform information
**Then** the distinction between TV and Portable should be visually immediate

**And** platform badges on cards should make this clear at a glance

**And** the platform selector tabs on detail pages should be prominent

**And** the color coding should reinforce the distinction (green/teal for TV, amber for Portable)

**And** the UX should follow the design system (UX-DR17)

**And** the distinction should work on all screen sizes

### Story 7.14: Hover States and Micro-Interactions

As a user on desktop,
I see visual feedback when interacting with elements,
So that the platform feels responsive and polished.

**Acceptance Criteria:**

**Given** I am on a desktop device with a mouse
**When** I hover over interactive elements
**Then** game cards should lift with increased shadow

**And** buttons should have hover background changes

**And** links should have hover underlines

**And** the platform selector tabs should show hover states

**And** the micro-interactions should be subtle and not distracting (UX-DR18)

**And** the interactions should follow the design system

**And** reduced-motion preferences should be respected (prefers-reduced-motion)

### Story 7.15: Loading States

As a user waiting for content,
I see appropriate loading indicators,
So that I know the platform is working and nothing is broken.

**Acceptance Criteria:**

**Given** I am waiting for content to load
**When** the content is being fetched
**Then** skeleton screens should be shown for game cards and detail pages

**And** buttons should show loading spinners during submission

**And** the loading states should match the layout of the final content

**And** the loading animations should be subtle (pulse effect)

**And** loading states should be accessible (ARIA announcements)

**And** the loading patterns should follow the design system (UX-DR19)

**And** loading should complete within acceptable timeframes (< 2s for pages)

### Story 7.16: Feedback Patterns

As a user interacting with the platform,
I receive clear feedback on my actions,
So that I know what succeeded, failed, or needs attention.

**Acceptance Criteria:**

**Given** I complete an action on the platform
**When** I need feedback
**Then** success should be indicated with green checkmark and positive message

**And** errors should be indicated with red X and clear error message

**And** warnings should be indicated with amber warning icon

**And** info messages should be indicated with blue info icon

**And** toast notifications should auto-dismiss after 3 seconds

**And** feedback should be accessible (ARIA live regions, color + icon + text)

**And** the feedback patterns should follow the design system (UX-DR20)

**And** form validation errors should appear inline below the field


