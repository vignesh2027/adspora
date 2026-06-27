# Adspora - Product Requirements Document

## Overview
Adspora is an AI-powered Creative-Fatigue Intelligence platform for performance marketing teams. It detects creative fatigue across Google, Meta, Taboola and TikTok, diagnoses why creatives are dying, and generates instant replacement ad copy.

## Architecture
- **Backend**: FastAPI (Python) on port 8001
- **Frontend**: React with Tailwind CSS + Shadcn UI
- **Database**: MongoDB
- **AI**: OpenAI GPT-5.2 via Emergent Universal Key
- **Theme**: Emerald Noir (dark, #050A08 bg, #10B981 accent)

## What's Been Implemented (June 27, 2026)

### Core Features
1. **Auth System** - JWT with httpOnly cookies, admin seeding, one-click demo mode
2. **Dashboard** - 6 stat cards, ROAS trend chart, Platform ROAS bar chart, Creative Health donut chart, CTR trend line chart, Daily Revenue chart, Platform Spend breakdown, Recent Alerts
3. **Creatives Command Center** - Sortable/filterable table with 24+ demo creatives, fatigue gauge (0-100), status pills (Healthy/Watch/Fatiguing/Dead), days remaining prediction
4. **Creative Detail** - Individual creative view with ROAS/CTR history charts, metrics cards
5. **AI Studio** - AI diagnosis (streaming SSE with GPT-5.2), AI ad copy generation (3 variations per creative), copy-to-clipboard
6. **CSV/Excel Upload** - Drag-and-drop upload, auto column mapping, instant fatigue scoring
7. **Alerts** - Spend-at-risk alerts for fatiguing/dead creatives, dismiss functionality
8. **Settings** - Breakeven ROAS config, alert thresholds, notification preferences, platform connections

### Technical
- Fatigue scoring algorithm: ROAS decline (35pts) + CTR trend (25pts) + Breakeven proximity (25pts) + Age decay (15pts)
- Cross-platform normalization: Google, Meta, Taboola, TikTok
- Demo data: 24 creatives across 4 platforms with realistic performance history
- Streaming AI responses via Server-Sent Events

## User Personas
1. **Media Buyer** - Primary user managing ad creatives across platforms
2. **Performance Marketing Manager** - Oversees team and needs portfolio-level view
3. **Creative Strategist** - Uses AI Studio for diagnosis and ideation

## Prioritized Backlog

### P0 (Next)
- Brute force protection on login
- Real ad account integrations (Meta API, Google Ads API)
- Automated refresh scheduling

### P1
- Slack/email alert delivery
- Weekly PDF report generation
- Creative performance benchmarking across accounts

### P2
- Team collaboration features
- A/B test tracking for generated replacements
- Custom fatigue scoring weights per account
- Multi-workspace support
