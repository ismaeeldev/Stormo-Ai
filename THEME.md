# STORMO.IO — Theme & Design System Guidelines
> **Place this file in the ROOT of your project folder.**
> Every AI prompt in this project references this file. Never change values here without updating all related components.

---

## 1. Brand Colors

| Token Name         | Hex Value  | CSS Variable                | Usage |
|--------------------|------------|------------------------------|-------|
| Primary Orange     | `#E8621A`  | `--color-primary`            | CTAs, logo, headings, icons, borders, checkmarks |
| Dark Background    | `#1A1A1A`  | `--color-dark`               | Hero section, footer, dark cards, navbar on scroll |
| White              | `#FFFFFF`  | `--color-white`              | Section backgrounds, card backgrounds, button text on orange |
| Light Gray BG      | `#F5F5F5`  | `--color-light-gray-bg`      | Alternate section backgrounds (How It Works, Why Stormo) |
| Body Text          | `#1A1A1A`  | `--color-body-text`          | All body copy, default text |
| Muted Gray         | `#AAAAAA`  | `--color-muted`              | Subheadlines, secondary text |
| Subtle Gray        | `#666666`  | `--color-subtle`             | Trust lines, captions, footer sub-text |
| Light Orange Tint  | `#FDF0E8`  | `--color-orange-tint`        | Table highlight column, card hover bg, subtle accent |
| Orange Border      | `#E8621A`  | `--color-orange-border`      | 2px card top borders, section dividers, Growth pricing card |
| Destructive Red    | `#DC2626`  | `--color-destructive`        | Destructive buttons (cancel, delete) |

### Tailwind CSS Config (add to `tailwind.config.ts`)
```js
colors: {
  primary:      '#E8621A',
  dark:         '#1A1A1A',
  'light-bg':   '#F5F5F5',
  muted:        '#AAAAAA',
  subtle:       '#666666',
  'orange-tint':'#FDF0E8',
  destructive:  '#DC2626',
}
```

---

## 2. Typography

**Font Family:** Inter (Google Fonts)
```html
<!-- Add to <head> in layout.tsx -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
```
```css
font-family: 'Inter', sans-serif; /* apply globally */
```

| Element         | Desktop Size | Mobile Size | Font Weight     | Color     |
|-----------------|--------------|-------------|-----------------|-----------|
| Hero Headline   | 56–64px      | 36–40px     | 800 (Black)     | `#FFFFFF` |
| Section Headline| 36–40px      | 28–32px     | 700 (Bold)      | `#1A1A1A` |
| Sub-headline    | 18–20px      | 16–18px     | 400 (Regular)   | `#AAAAAA` |
| Body Copy       | 16–18px      | 15–16px     | 400 (Regular)   | `#1A1A1A` |
| Card Title      | 18–20px      | 17–18px     | 600 (SemiBold)  | `#1A1A1A` |
| Card Body       | 14–16px      | 14–15px     | 400 (Regular)   | `#666666` |
| Button Text     | 16–18px      | 15–16px     | 600 (SemiBold)  | `#FFFFFF` |
| Nav Links       | 15–16px      | 14px        | 500 (Medium)    | `#AAAAAA` |
| Trust Lines     | 12–13px      | 12px        | 400 (Regular)   | `#666666` |
| Footer Text     | 13–14px      | 13px        | 400 (Regular)   | `#AAAAAA` |

---

## 3. Buttons

| Variant           | Background  | Text      | Border Radius | Padding      | Hover State         |
|-------------------|-------------|-----------|---------------|--------------|---------------------|
| Primary CTA (Orange) | `#E8621A` | `#FFFFFF` | 8px           | 14px 28px    | `#C4531A` (darken 10%) |
| Primary CTA (White)  | `#FFFFFF` | `#E8621A` | 8px           | 14px 28px    | bg `#FDF0E8`        |
| Secondary Outline    | transparent | `#E8621A` | 8px           | 12px 24px    | bg `#FDF0E8`        |
| Nav CTA           | `#E8621A`   | `#FFFFFF` | 6px           | 10px 20px    | `#C4531A`           |
| Destructive       | `#DC2626`   | `#FFFFFF` | 8px           | 12px 24px    | darken 10%          |

---

## 4. Cards

```css
background:    #FFFFFF;
box-shadow:    0 2px 12px rgba(0,0,0,0.08);
border-radius: 12px;
padding:       24px;
/* Featured/highlighted cards only: */
border-top:    3px solid #E8621A;
/* Hover state: */
transform:     translateY(-2px);
box-shadow:    0 6px 20px rgba(0,0,0,0.14);
```

---

## 5. Spacing Scale

| Name  | Value  | Usage |
|-------|--------|-------|
| xs    | 4px    | Icon gaps, small inline spacing |
| sm    | 8px    | Button icon gaps, tight list items |
| md    | 16px   | Card inner padding (tight), list spacing |
| lg    | 24px   | Card padding, section inner spacing |
| xl    | 48px   | Between sub-sections |
| 2xl   | 80px   | Section top/bottom padding (desktop) |
| 3xl   | 120px  | Hero vertical padding |

---

## 6. Icons

- **Library:** Lucide React — `npm install lucide-react`
- **Default size:** 24px | In cards: 20px | Inline: 18px
- **Accent icon color:** `#E8621A`
- **Neutral icon color:** `#1A1A1A`

---

## 7. Responsive Breakpoints

| Breakpoint | Width       | Rule |
|------------|-------------|------|
| Mobile     | < 768px     | Single column, stacked layout, hamburger nav |
| Tablet     | 768–1024px  | Two column max, reduced hero padding |
| Desktop    | > 1024px    | Full multi-column, max-width 1280px container |

```css
/* Tailwind equivalents */
/* sm: 640px | md: 768px | lg: 1024px | xl: 1280px */
max-width: 1280px;
margin: 0 auto;
```

---

## 8. Navbar Rules

- Fixed position, always visible on scroll
- Default bg: transparent
- On scroll: bg transitions to `#1A1A1A` with `box-shadow: 0 2px 8px rgba(0,0,0,0.3)`
- Logo: "Stormo.io" in `#E8621A`
- Nav links: `#AAAAAA`, hover `#FFFFFF`
- CTA button: always visible, never hidden on mobile

---

## 9. Section Background Alternation Pattern

| Section                | Background  |
|------------------------|-------------|
| Hero                   | `#1A1A1A`   |
| Pain / Without-With    | `#FFFFFF`   |
| How It Works           | `#F5F5F5`   |
| Features (6 cards)     | `#FFFFFF`   |
| Comparison Table       | `#F5F5F5`   |
| Pricing                | `#FFFFFF`   |
| Social Proof           | `#1A1A1A`   |
| Final CTA Band         | `#E8621A`   |
| Footer                 | `#1A1A1A`   |

---

## 10. Dashboard UI Rules

- Sidebar background: `#1A1A1A`
- Sidebar active nav item: left border `3px solid #E8621A`, text `#FFFFFF`
- Sidebar inactive nav item: text `#AAAAAA`, hover text `#FFFFFF`
- Main content area background: `#F5F5F5`
- Dashboard cards: white bg, `border-radius: 12px`, standard card shadow
- Ask Stormo floating button: `#E8621A`, circle, `z-index: 50`, bottom-right fixed

---

## 11. Animation & Transition Defaults

```css
transition: all 0.2s ease;           /* buttons, nav items */
transition: transform 0.2s ease, box-shadow 0.2s ease;  /* cards */
scroll-behavior: smooth;             /* on <html> element */
```

---

## 12. Form Inputs

```css
border: 1.5px solid #AAAAAA;
border-radius: 8px;
padding: 12px 16px;
font-size: 16px;
color: #1A1A1A;
background: #FFFFFF;
/* Focus: */
border-color: #E8621A;
outline: none;
box-shadow: 0 0 0 3px rgba(232,98,26,0.15);
```

---

> **Reference:** Full design details in SRS Section 1. This file is the single source of truth for all frontend styling.
