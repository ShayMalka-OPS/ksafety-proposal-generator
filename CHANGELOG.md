# Changelog

## [1.0.0] — 2026-04-08

### Added
- feat: initial project scaffold (Next.js 14, TypeScript, Tailwind CSS)
- feat: build K-Safety Proposal Generator application (core wizard flow)
- feat: add hw-calculator with Excel model formulas for infrastructure sizing
- feat: add product description extractor for all K-Safety modules
- feat: add proposal document generator with KABATONE template
- feat: complete proposal preview and PDF/Word export
- feat: add editable prices with default values from pricing sheet
- feat: add dynamic price calculation with 5-year cost comparison
- feat: add proposal history dashboard with save, view, and delete actions
- feat: add navigation bar across all pages
- feat: add product line selector and Cloud vs On-Prem deployment option
- feat: add About page with version info and contact details
- feat: replace browser print with server-side puppeteer PDF rendering
- feat: AI-generated executive summary per proposal (Claude API)
- feat: AI summary button in proposal wizard
- feat: save-to-history action from proposal preview
- test: add full QA test suite (pricing, history, API, E2E, build)

### Fixed
- fix: resolve 5 critical bugs in HW calculator, pricing comparison, and AI summary
- fix: logo branding corrections
- fix: resolve build errors blocking production deployment
- fix: remove unused variables causing Vercel build failure
- fix: remove exported constants from About page causing Next.js page constraint error

### Changed
- design: apply full brand spec — Kabatone logo, typography, buttons, progress bar
