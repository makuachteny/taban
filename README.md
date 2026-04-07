# TABAN - Digital Health Records System for South Sudan

A comprehensive, offline-first healthcare information system built for South Sudan's health sector. TABAN provides electronic medical records, clinical decision support, disease surveillance, vital registration, and government health oversight across all levels of the health system — from community boma health workers to the national Ministry of Health.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Authentication & Roles](#authentication--roles)
- [Modules & Features](#modules--features)
- [AI & Clinical Decision Support](#ai--clinical-decision-support)
- [Data Architecture](#data-architecture)
- [Offline-First Design](#offline-first-design)
- [Multi-Tenancy & Organizations](#multi-tenancy--organizations)
- [Security](#security)
- [Testing](#testing)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Demo Accounts](#demo-accounts)

---

## Overview

TABAN is purpose-built for the South Sudanese health system, addressing the unique challenges of delivering healthcare across 10 states with limited connectivity, infrastructure, and resources. The system supports:

- **Hospital networks** — Patient registration, consultations, referrals, lab, pharmacy
- **Community health** — Boma health worker household visits, payam supervisor oversight
- **Maternal & child health** — 8-contact ANC protocol (WHO), birth registration, immunization tracking
- **Disease surveillance** — Real-time outbreak alerts, epidemic intelligence
- **Vital registration** — Birth and death CRVS with ICD-11 cause coding
- **Government oversight** — National health statistics, facility assessments, DHIS2 export

The system works entirely offline and syncs when connectivity is available.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| UI | React 18, Tailwind CSS 3.4, Lucide Icons |
| Charts | Recharts 3.7 |
| Mapping | Leaflet + React Leaflet |
| Client Database | PouchDB 9 (browser-side) |
| Server Database | CouchDB (sync), PostgreSQL (analytics) |
| Authentication | JWT (jose), bcryptjs |
| Testing | Jest 30, Testing Library |
| Linting | ESLint, Next.js config |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd taban

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The application seeds demo data automatically on first load, including sample patients, hospitals, users, and health records.

### Optional: CouchDB Sync

To enable server sync for multi-device use:

1. Install and run CouchDB
2. Set `NEXT_PUBLIC_SYNC_ENABLED=true` in `.env.local`
3. Configure `NEXT_PUBLIC_COUCHDB_URL` with your CouchDB endpoint

---

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/           # Protected dashboard routes (26+ pages)
│   │   ├── page.tsx           # Doctor/clinical officer dashboard
│   │   ├── patients/          # Patient registry & records
│   │   ├── consultation/      # Clinical documentation
│   │   ├── referrals/         # Referral management
│   │   ├── lab/               # Laboratory orders & results
│   │   ├── pharmacy/          # Medication dispensing & inventory
│   │   ├── anc/               # Antenatal care (WHO 8-contact)
│   │   ├── births/            # Birth registration (CRVS)
│   │   ├── deaths/            # Death registration (ICD-11)
│   │   ├── immunizations/     # Vaccination tracking
│   │   ├── surveillance/      # Disease surveillance & alerts
│   │   ├── epidemic-intelligence/  # Outbreak analysis
│   │   ├── hospitals/         # Facility network & mapping
│   │   ├── mch-analytics/     # Maternal & child health analytics
│   │   ├── facility-assessments/   # Facility readiness
│   │   ├── data-quality/      # Data quality monitoring
│   │   ├── vital-statistics/  # Population health metrics
│   │   ├── dhis2-export/      # DHIS2 interoperability
│   │   ├── reports/           # Health system reporting
│   │   ├── messages/          # Doctor-patient messaging
│   │   ├── settings/          # User preferences
│   │   ├── government/        # National health surveillance
│   │   ├── admin/             # Super admin (orgs, users, billing, system)
│   │   ├── org-admin/         # Organization management
│   │   ├── nurse/             # Nurse station dashboard
│   │   ├── lab-dashboard/     # Lab command center
│   │   ├── pharmacy-dashboard/# Pharmacy operations
│   │   ├── front-desk/        # Patient reception
│   │   ├── boma/              # Community health worker dashboard
│   │   └── payam/             # Payam supervisor dashboard
│   ├── api/
│   │   ├── auth/              # Login, logout, session endpoints
│   │   └── sync/              # CouchDB sync API
│   ├── login/                 # Login page
│   └── public-stats/          # Public-facing health statistics
├── components/
│   ├── Sidebar.tsx            # Collapsible navigation sidebar
│   ├── TopBar.tsx             # Page header
│   ├── AssistantChat.tsx      # AI medical assistant chat widget
│   ├── ClinicalScribe.tsx     # AI voice/text clinical note parser
│   ├── SymptomChecker.tsx     # Patient intake symptom form
│   ├── HospitalMap.tsx        # Leaflet facility map
│   └── ...                    # Additional UI components
├── lib/
│   ├── context.tsx            # AppContext & useApp hook
│   ├── db.ts                  # PouchDB database factory
│   ├── db-types.ts            # TypeScript interfaces for all documents
│   ├── db-seed.ts             # Demo data seeding
│   ├── permissions.ts         # Role-based access control
│   ├── auth-token.ts          # JWT token management
│   ├── branding.ts            # Organization branding system
│   ├── hooks/                 # 24 custom React hooks
│   ├── services/              # 25 business logic services
│   ├── sync/                  # PouchDB-CouchDB sync manager
│   └── ai/                    # AI diagnosis engine & assistant
└── data/
    └── mock.ts                # Mock data (hospitals, patients, diseases)
```

---

## Authentication & Roles

### Authentication Flow

1. User submits credentials at `/login`
2. Server validates against bcrypt-hashed password in PouchDB
3. JWT token (24-hour expiry) set as HTTP-only cookie
4. Middleware enforces route-level access per role
5. Rate limiting: 5 failed attempts triggers a 15-minute lockout

### RBAC — 11 User Roles

| Role | Access Level | Primary Dashboard |
|------|-------------|-------------------|
| `super_admin` | Platform-wide administration | `/admin` |
| `org_admin` | Organization management | `/org-admin` |
| `doctor` | Full clinical access | `/dashboard` |
| `clinical_officer` | Clinical provider (paramedical) | `/dashboard` |
| `nurse` | Nursing station | `/dashboard/nurse` |
| `lab_tech` | Laboratory operations | `/dashboard/lab` |
| `pharmacist` | Pharmacy operations | `/dashboard/pharmacy` |
| `front_desk` | Patient reception & registry | `/dashboard/front-desk` |
| `government` | Ministry of Health oversight | `/government` |
| `boma_health_worker` | Community household visits | `/dashboard/boma` |
| `payam_supervisor` | Administrative health unit | `/dashboard/payam` |

Each role has granular permissions controlling access to modules, data scope, and available actions. Unauthorized routes redirect to the user's default dashboard.

---

## Modules & Features

### Clinical

- **Patient Registry** — Registration, search, filtering by demographics and location. Detailed patient profiles with full medical history.
- **Consultation** — Chief complaint capture, vital signs entry (temperature, BP, O2 saturation, pulse, respiratory rate), physical examination (HEENT, cardiac, respiratory, abdominal, neurological), AI-powered diagnosis suggestions, lab ordering, and prescription writing.
- **Referrals** — Inter-facility patient referral with urgency levels, status tracking (sent, received, accepted, declined, completed), and clinical reason documentation.
- **Laboratory** — Test ordering, sample tracking, result entry with status workflow (ordered, collected, processing, completed). Lab command center dashboard for technicians.
- **Pharmacy** — Prescription queue management, medication dispensing, inventory tracking. Pharmacist operations dashboard.

### Maternal & Child Health

- **Antenatal Care (ANC)** — Full WHO 8-contact protocol. Tracks gravida/parity, vital signs, fetal assessment (heart rate, fundal height), risk stratification, and birth planning.
- **Birth Registration** — CRVS-compliant birth registration with child and parent details, birth weight, delivery method, attendant type, and certificate number.
- **Immunizations** — Vaccination schedule tracking, coverage monitoring, and campaign management.
- **MCH Analytics** — Cascade analysis, mortality tracking, outcomes visualization.

### Public Health

- **Disease Surveillance** — Real-time disease alert system with severity classification, geographic distribution, and trend analysis.
- **Epidemic Intelligence** — Outbreak tracking, cluster detection, and response coordination.
- **Death Registration** — CRVS-compliant death registration with ICD-11 cause of death coding (immediate, antecedent, underlying causes), manner of death classification, and maternal death linkage.
- **Vital Statistics** — Population health metrics and demographic analysis.

### Administration & Reporting

- **Hospital Network** — Facility management with interactive Leaflet map, sync status indicators, performance metrics overlay.
- **Facility Assessments** — Health facility readiness evaluations (infrastructure, staffing, services, equipment).
- **Data Quality** — Completeness and quality monitoring for submitted health data.
- **DHIS2 Export** — Interoperability with the national DHIS2 health information system.
- **Reports** — Configurable health system reporting.
- **Public Statistics** — Public-facing health dashboard (no login required).

### Communication

- **Doctor-Patient Messaging** — In-app messaging between providers and patients with SMS notification support.

### Platform Administration

- **Organization Management** — Create and manage organizations with custom branding.
- **User Management** — Platform-wide user CRUD with role assignment.
- **Billing** — Subscription plan management (basic, professional, enterprise).
- **System Configuration** — Platform-wide settings and feature flags.
- **Audit Logging** — Complete audit trail of login/logout, data access, and modifications.

---

## AI & Clinical Decision Support

### Offline Diagnosis Engine

A rule-based clinical decision support engine (`lib/ai/diagnosis-engine.ts`) that runs entirely in the browser with zero network dependency:

- Disease rules for malaria, respiratory infections, diarrheal disease, maternal complications, and more
- Evaluates vital signs, physical exam findings, patient demographics, chronic conditions, and allergies
- Outputs diagnosis suggestions with confidence scores, severity assessment, recommended tests, and treatment plans
- Integrated ICD-10 coding
- Based on WHO/IMCI clinical guidelines

### Clinical Scribe

AI-powered clinical note parser (`components/ClinicalScribe.tsx`):

- Voice-to-text transcription of clinical encounters
- Natural language processing to extract structured medical data
- Auto-extraction of chief complaint, vital signs, exam findings, and assessment
- Suggestion system for diagnoses and lab tests

### Medical Assistant

Context-aware floating chat widget (`components/AssistantChat.tsx`):

- Medical knowledge base queries
- WHO guideline references (IMCI, ANC protocols)
- Medication and procedure information
- Symptom-based differential guidance

---

## Data Architecture

### PouchDB Collections (Client-Side)

| Database | Purpose |
|----------|---------|
| `taban_patients` | Patient demographics & registration |
| `taban_users` | User accounts |
| `taban_hospitals` | Health facility records |
| `taban_medical_records` | Consultations & diagnoses |
| `taban_referrals` | Patient referral network |
| `taban_lab_results` | Laboratory orders & results |
| `taban_prescriptions` | Medication orders |
| `taban_messages` | Doctor-patient communication |
| `taban_births` | Birth registration (CRVS) |
| `taban_deaths` | Death registration (ICD-11) |
| `taban_facility_assessments` | Facility readiness checks |
| `taban_immunizations` | Vaccination records |
| `taban_anc` | Antenatal care visits |
| `taban_boma_visits` | Community health worker visits |
| `taban_follow_ups` | Patient follow-up tracking |
| `taban_organizations` | Organization records |
| `taban_audit_log` | Audit trail |

### Server-Side

- **CouchDB** — Optional bidirectional sync with PouchDB for multi-device/multi-site access
- **PostgreSQL** — Aggregated analytics and reporting (server-only, never exposed to browser)

### Business Logic

25 service files under `lib/services/` encapsulate all database operations, validation, and business rules. Each service is paired with a corresponding React hook in `lib/hooks/` (24 hooks total) for seamless UI integration.

---

## Offline-First Design

TABAN is built for environments with limited or intermittent connectivity:

- **All data stored locally** in PouchDB — the app is fully functional without internet
- **Service Worker** registered for offline page access and asset caching
- **Sync queue** — Changes are queued when offline and automatically synced when connectivity returns
- **Online/offline detection** with visual indicators in the UI
- **Background sync** — Service worker triggers sync on reconnection
- **Sync Manager** (`lib/sync/sync-manager.ts`) coordinates per-database replication with status tracking

---

## Multi-Tenancy & Organizations

- **Public organizations** — Ministry of Health, government departments (see all national data)
- **Private organizations** — Hospital groups, NGOs (scoped to their own data)
- **Custom branding** — Each organization can configure colors, logo, and name
- **Feature flags** — Org admins enable/disable modules (epidemic intelligence, MCH analytics, DHIS2 export, etc.)
- **Subscription plans** — Basic, professional, and enterprise tiers with different feature access
- **Data scoping** — Users see only their organization's data; government roles see national data

---

## Security

- **HTTPS-only cookies** in production with `HttpOnly` and `SameSite=Lax` flags
- **Content Security Policy** headers (X-Frame-Options, HSTS, referrer policy)
- **Rate limiting** — 5 failed login attempts trigger a 15-minute lockout
- **Timing-attack resistance** — Constant-time password comparison with dummy hash on user-not-found
- **Password hashing** — bcryptjs with salt rounds
- **JWT tokens** — HS256 signing with 24-hour expiry via jose
- **Input validation** — Username and password sanitization
- **Audit logging** — All authentication events and data modifications logged

---

## Testing

```bash
# Run all tests
npm test

# Run tests in CI mode with coverage
npm run test:ci
```

Tests use Jest 30 with ts-jest for TypeScript support and JSDOM for browser environment simulation. Test files are located in `src/__tests__/`.

---

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# CouchDB Sync (optional)
NEXT_PUBLIC_SYNC_ENABLED=false
NEXT_PUBLIC_COUCHDB_URL=http://localhost:5984
COUCHDB_ADMIN_USER=admin
COUCHDB_ADMIN_PASSWORD=password

# PostgreSQL (server-side analytics)
DATABASE_URL=postgresql://user:password@localhost:5432/taban

# Authentication
JWT_SECRET=your-secret-key

# Demo Request Emails (required for production demo form)
DEMO_FROM_EMAIL=demo@yourdomain.com
DEMO_FROM_NAME=Taban Demo
DEMO_NOTIFY_EMAIL=tenymakuach@gmail.com
DEMO_SCHEDULING_URL=https://calendly.com/your-handle/taban-demo
RESEND_API_KEY=your-resend-key
# Or use SendGrid instead of Resend:
# SENDGRID_API_KEY=your-sendgrid-key
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on `localhost:3000` |
| `npm run build` | Create production build |
| `npm start` | Run production server |
| `npm run lint` | Run ESLint checks |
| `npm test` | Run Jest test suite |
| `npm run test:ci` | Run tests with coverage reporting |

---

## Demo Accounts

The application seeds the following demo accounts on first load:

| Username | Password | Role |
|----------|----------|------|
| `superadmin` | `Super@Taban2026!` | Super Admin |
| `org.admin` | `OrgAdmin@Mercy2026` | Organization Admin |
| `dr.wani` | `Dr.Wani@JTH2026` | Doctor |
| `admin` | `TabanGov#2026!Ss` | Government |
| `bhw.akol` | `BHW.Akol@KJ2026` | Boma Health Worker |
| `sup.mary` | `Sup.Mary@KJ2026` | Payam Supervisor |

---

## South Sudan Health System Context

TABAN is designed around South Sudan's administrative and health system structure:

- **Facility levels** — National referral hospitals, state hospitals, county health departments, PHCCs (Primary Health Care Centers), PHCUs (Primary Health Care Units)
- **Administrative divisions** — 10 states, counties, payams, bomas
- **Disease priorities** — Malaria-endemic protocols, maternal mortality reduction, immunization coverage expansion
- **Community health** — Boma health workers conduct household visits; payam supervisors provide oversight
- **Vital registration** — CRVS (Civil Registration and Vital Statistics) integration for births and deaths
- **National reporting** — DHIS2 export for Ministry of Health data aggregation

---

## License

This project is proprietary software developed for SafeguardJunub.
