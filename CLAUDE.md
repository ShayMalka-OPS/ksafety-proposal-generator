# K-Safety Proposal Generator

## About This Project
A web application for the Kabatone sales team to generate 
professional proposals for the K-Safety smart city platform.

## GitHub Repository
https://github.com/ShayMalka-OPS/ksafety-proposal-generator

## Tech Stack
- Next.js 14 + TypeScript
- Tailwind CSS
- Anthropic Claude API (claude-sonnet-4-6)
- PDF export with puppeteer
- docx library for Word export

## Brand Colors
- Dark Blue: #1A3A5C
- Gold: #F0A500
- Mid Blue: #1E6BA8

## Products & Pricing

### K-Safety Core Platform
- Annual: $5,000/year (includes all base modules)
- Perpetual: $17,500 (one-time)
- Base modules included: Event Management, Task Management,
  BPM/RBE, Shift Management, Lists, Organizations, 
  Users/Groups, Reports/BI, Sensors Dashboard, GIS/Map

### CCTV Video Channels
- Annual: $100/channel/year
- Perpetual: $350/channel

### LPR - License Plate Recognition  
- Annual: $500/channel/year
- Perpetual: $1,750/channel

### Face Recognition
- Annual: $625/channel/year
- Perpetual: $2,188/channel

### Video Analytics (AI)
- Annual: $556/channel/year
- Perpetual: $1,946/channel

### User Licenses
- Annual: $100/user/year
- Perpetual: $350/user

### IoT Sensors
- Annual: $5/sensor/year
- Perpetual: $18/sensor

### K-Share Mobile App (citizen reporting)
- Entry (up to 50K population): Included
- Small (50K-100K): $10,000/year
- Medium (100K-500K): $20,000/year
- Large (500K-1M): $35,000/year
- Mega (1M+): $50,000/year

### K-React (first responder app)
- Annual: $50/unit/year
- Perpetual: $175/unit

### Professional Services
- Installation & Setup (2 weeks): $10,000
- Training & Implementation (1 week): $2,250
- Full Implementation (1 month): $15,000

## Pricing Rules
- Perpetual = Annual x 3.5
- Support from Year 2 = 20% of perpetual license per year
- Annual is always cheaper over 5 years than perpetual
- 5-year annual total = 5x annual fee
- 5-year perpetual total = 6.3x annual fee

## HW Infrastructure Rules
- Base: 3 application servers (Windows Server 2022)
- Add 1 server per 300 LPR channels
- Add 1 server per 100 FR channels  
- Add 1 server if HA mode enabled
- Always include: Active Directory server + Maintenance server
- SQL Server for database
- Elasticsearch for metadata search
- Ubuntu server for web frontend (NGINX + MongoDB + BFF)
- DMZ server required if K-Share or K-React is included

## Proposal Output Should Include
1. Cover page (customer name, city, date, Kabatone logo)
2. Executive summary (AI-generated, customer-specific)
3. Product descriptions for selected modules
4. Pricing table (annual vs perpetual comparison)
5. 5-year cost comparison
6. HW infrastructure requirements table
7. Professional Services section
8. Next steps / call to action
```

---

### Step 2 — In Claude Code, just say this
```
Read the CLAUDE.md file in this project. 
Then build the proposal generator application described in it.
Start with the project scaffold and push to GitHub.
```

Claude Code reads `CLAUDE.md` automatically every session — so it always knows your full project context **without you repeating yourself.**

---

### Step 3 — Add your documents progressively

You can also drop files into your project folder and tell Claude Code to read them:
```
Read the file pricing.pdf in this folder and extract 
all pricing information to update our pricing module
```
```
Read hw-calculator.html and use the calculation logic 
to build our infrastructure sizing module