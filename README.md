# LeadX

> **Find better leads. Pitch smarter.**

LeadX is an AI-powered lead discovery, qualification, and prospecting platform built for freelancers and agencies selling Website Development, Technical SEO, On-Page SEO, Local SEO, and SEO Audits to US businesses.

---

## 🌟 Core Architecture

LeadX enforces an **Evidence-First Rule**: Every identified pain point is proven with real extracted technical data.

```
Automated Discovery / Search Scraper → Deep Contact Enrichment → Website Audit → Deterministic Scoring → AI Qualification → Evidence-Backed Outreach
```

### 1. Lead Discovery & Automated Scraper (`src/services/discovery/`, `src/services/scraper/`)
- **Automated Search Scraper**: Enter any US industry (e.g. HVAC, Roofing, Plumbers, Dental) and city/state. LeadX automatically searches local business indexes, filters out directories/aggregators (Yelp, Angi, BBB), extracts raw business sites, and performs deep crawling on `/contact`, `/about`, and `/team` pages to extract verified emails, telephone numbers, and decision-maker contact details.
- **Website URL / Batch Paste**: Paste raw domains, single URLs, or multi-line business lists. Automatically normalizes domains and extracts metadata.
- **Manual Lead Entry**: Quick input with business name, category, location, phone, email, decision maker, and notes.
- **CSV Import**: Drag-and-drop CSV upload with intelligent automated column matching (`business_name`, `website`, `phone`, `email`, `city`, `state`, etc.) and duplicate resolution.
- **Deduplication**: Normalizes domains, emails, and phone numbers to prevent duplicates.

### 2. Website Crawler & Audit Engine (`src/services/crawler/`, `src/services/analyzer/`)
- **Technical SEO**: HTTPS SSL check, HTTP status, robots.txt, sitemap.xml, canonical URLs, meta robots indexability, mobile viewport, image alt coverage, server response time (TTFB).
- **On-Page SEO**: Title tag quality/length, meta description optimization, H1 tag presence/uniqueness/relevance, heading hierarchy, content word count/depth.
- **Local SEO**: LocalBusiness JSON-LD schema detection, click-to-call `tel:` links, city/state targeting, dedicated service area/location subpages.
- **Website Quality**: Conversion CTA & lead capture forms, social proof/reviews, navigation depth, copyright maintenance year.

### 3. Deterministic 100-Point Qualification Engine (`src/services/scorer/`)
Deterministic scoring breakdown (0–100):
- **Website Opportunity (0–25)**
- **SEO Opportunity (0–25)**
- **Local SEO Opportunity (0–20)**
- **Business Potential (0–15)**
- **Contactability (0–15)**

Classification:
- 🔥 **HOT**: 80–100
- 🟠 **WARM**: 60–79
- 🟡 **POTENTIAL**: 40–59
- ⚪ **LOW**: 0–39

### 4. AI Outreach Layer (`src/services/ai/grok-service.ts`)
- Multi-provider AI support: Works out-of-the-box with **GroqCloud** (`gsk_...` keys using ultra-fast LLMs like LLaMA / Qwen) as well as **xAI Grok** (`xai-...` keys).
- Feeds structured audit findings and evidence to the AI to generate conversational, non-spammy, evidence-backed pitches.
- Pitch variations: Standard / Conversational, Short / SMS, Direct / Commercial, and Formatted Email with high-open-rate subject lines.
- Guaranteed fallback engine so prospecting works even offline or without live API keys.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS (Clean Modern Light Mode: `#FFFFFF` / `#F8FAFC` slate background, `#0F172A` navy typography, `#10B981` emerald brand accents)
- **Icons**: Lucide React
- **Web Crawler & Parser**: Cheerio + Resilient Fetch
- **CSV Engine**: PapaParse with automated regex header matcher
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) + dual local file-backed persistence fallback for instant development
- **AI Engine**: Groq & xAI Grok API (`GROK_API_KEY`)

---

## 🚀 Getting Started

### 1. Environment Variables
Create a `.env.local` file (or copy from `.env.example`):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Grok AI API Configuration (xAI)
GROK_API_KEY=your-xai-grok-key
GROK_MODEL=grok-beta

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Database Setup (Supabase)
Run the migration script located at [`supabase/schema.sql`](file:///e:/laragon/www/LeadX/supabase/schema.sql) in your Supabase SQL Editor.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
