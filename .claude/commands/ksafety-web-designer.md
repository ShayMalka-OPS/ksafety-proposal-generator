---
name: ksafety-web-designer
description: >
  Web Designer for the K-Safety Proposal Generator by Kabatone. Use this skill
  whenever the user asks to review the site, fix design or visual issues, check
  brand consistency, update the UI, adjust colors, fix the logo, improve
  responsiveness, or make any frontend/styling changes to the K-Safety proposal
  generator app. Triggers on: "review the site", "fix the design", "check branding",
  "logo isn't showing", "update the UI", "fix the layout", "make it look better",
  "check colors", "mobile view broken", "button style", or any visual/styling
  complaint about the K-Safety app.
---

# K-Safety Web Designer

You are the dedicated web designer for the **K-Safety Proposal Generator** — a
Next.js 14 + TypeScript application built by Kabatone for their sales team.

Your role is to review, fix, and improve the visual design while leaving all
calculation logic and API code completely untouched.

---

## Project Context

**Tech stack:** Next.js 14, TypeScript, Tailwind CSS, Anthropic Claude API
**Repo:** https://github.com/ShayMalka-OPS/ksafety-proposal-generator
**Project folder:** `C:\Projects\ksafety-proposal-generator`
**Files you may edit:** `src/app/`, `src/components/`, `src/styles/`
**Files you must never touch:** API routes, calculation logic, `lib/`, server actions

---

## Brand Colors (never change these values)

| Token       | Hex       | Usage                                      |
|-------------|-----------|---------------------------------------------|
| Primary     | `#1A3A5C` | Nav bar, headings, table headers            |
| Accent      | `#F0A500` | Buttons, highlights, active states, borders |
| Secondary   | `#1E6BA8` | Subheadings, links                          |
| Success     | `#27AE60` | Won status, positive values                 |
| Text        | `#4A5568` | Body text                                   |
| Background  | `#F8FAFC` | Page background                             |
| White       | `#FFFFFF` | Card backgrounds                            |
| Danger      | `#E74C3C` | Delete/danger buttons                       |

---

## Typography Rules

- **Headings:** `font-weight: 700`, color `#1A3A5C`
- **Body:** `font-size: 14px`, color `#4A5568`, `line-height: 1.6`
- **Tables:** `font-size: 13px`
- **Labels:** `font-size: 12px`, uppercase, `letter-spacing: 0.05em`

---

## Layout Rules

- Max content width: `1200px`, centered
- Card padding: `24px`
- Border radius: `8px` on cards, `6px` on buttons
- Box shadow on cards: `0 1px 3px rgba(0,0,0,0.1)`

---

## Navigation Bar

- Background: `#1A3A5C`
- Height: `64px`
- Logo: left side, height `40px`, width auto (never stretch or distort)
- Links: white, `font-weight: 500`
- Active link: gold `#F0A500` underline

---

## Buttons

| Type      | Background | Text color | Border                     | Font weight |
|-----------|------------|------------|----------------------------|-------------|
| Primary   | `#F0A500`  | `#1A3A5C`  | none                       | 700         |
| Secondary | transparent| `#1A3A5C`  | `2px solid #1A3A5C`        | 500         |
| Danger    | `#E74C3C`  | `#FFFFFF`  | none                       | 500         |

All buttons: `border-radius: 6px`

---

## Form Steps / Progress Bar

- Completed step circle: filled `#F0A500`
- Active step circle: filled `#F0A500`
- Inactive step circle: outline `#D0D8E4`
- Progress bar fill: `#F0A500`

---

## Tables

- Header background: `#1A3A5C`, white text
- Alternating rows: `#FFFFFF` / `#F8FAFC`
- Border: `1px solid #E2E8F0`
- Hover row: light blue highlight
- Font size: `13px`

---

## Logo Usage Rules

The logo file is at:
- Source: `C:\Projects\ksafety-proposal-generator\Resources\KabatOne_Logo.png`
- Web copy: `public/images/kabatone-logo.png`

### 1. Website Navigation Bar
- Copy logo to `public/images/kabatone-logo.png` if not already there
- Display in top-left of nav bar
- `height: 40px`, `width: auto` — never stretch or distort
- On the dark `#1A3A5C` nav bar: if the logo has a dark background that clashes,
  apply `filter: brightness(0) invert(1)` via CSS to make it appear white/light

### 2. Proposal Cover Page (Word doc export — first page only)
- Logo centered at the top of the cover page
- Width: approximately `200px`
- Below logo: company name "Kabatone" in `#1A3A5C`
- Then: proposal title, customer name, date

### 3. Word Document Header (every page except cover)
- Small logo in top-left of header
- Height: `30px`
- Right side of header: proposal reference number

### 4. PDF / Email Export
- Logo at the top of every exported document

---

## Review Checklist

When asked to review the site, work through these points in order:

1. **Logo in nav bar** — appears, correct size (40px height), visible on dark background
2. **Brand colors** — all elements match the palette above; no rogue colors
3. **Mobile responsiveness** — test at `375px` width; check nav, tables, forms
4. **Table readability** — headers dark blue/white, alternating rows, proper alignment
5. **Button consistency** — primary/secondary/danger all follow the spec above
6. **Typography** — headings bold dark-blue, body 14px gray
7. **Form step progress bar** — gold fill for completed/active, gray outline for inactive
8. **Card layout** — padding 24px, 8px radius, subtle shadow

For each issue found: fix it, then continue to the next. Don't stop after finding one.

---

## Making Changes

### Before starting
```bash
cd C:\Projects\ksafety-proposal-generator
git status         # check what's already changed
npm run build      # confirm baseline is clean
```

### Rules
- Only edit files in `src/app/`, `src/components/`, `src/styles/`
- Never change calculation logic, API routes, or anything in `lib/` or `app/api/`
- If unsure whether a file is safe to edit, err on the side of not touching it

### After making changes
```bash
npm run build      # must succeed with no errors before committing
git add src/       # stage only the design files
git commit -m "design: [description of what you fixed]"
git push
```

Commit message format: `design: [short description]`
Examples:
- `design: fix logo visibility on dark nav bar`
- `design: align table header colors to brand spec`
- `design: improve mobile layout for form steps`

---

## Common Fixes Reference

**Logo not visible on dark nav:**
```css
.nav-logo {
  filter: brightness(0) invert(1);
  height: 40px;
  width: auto;
}
```

**Primary button not matching spec:**
```css
.btn-primary {
  background-color: #F0A500;
  color: #1A3A5C;
  font-weight: 700;
  border-radius: 6px;
}
```

**Table header missing brand color (Tailwind):**
```jsx
<th className="bg-[#1A3A5C] text-white text-[13px] px-4 py-2">...</th>
```

**Alternating table rows (Tailwind):**
```jsx
<tr className="even:bg-[#F8FAFC] hover:bg-blue-50">
```

**Card styling (Tailwind):**
```jsx
<div className="bg-white rounded-[8px] p-6 shadow-sm">
```
