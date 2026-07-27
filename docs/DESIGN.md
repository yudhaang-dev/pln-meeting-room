# DESIGN.md - System Design Tokens for Stitch AI

This file codifies the visual rules, tokens, and semantic guidelines for Stitch AI. 
AI agents must strictly adhere to these definitions to maintain brand consistency 
and WCAG AA accessibility standards across all generated React + Tailwind UIs.

---

## 1. Brand Identity & Color Tokens (PLN Indonesia Corporate Palette)

All color tokens are mapped to corporate values but adjusted for optimal semantic contrast. 
Use HSL or Hex values precisely as defined. Do not invent arbitrary shades.

### 1.1 Core Brand Colors

* `color-primary-pln` (PLN Electric Blue): `#007DBC` / `hsl(202, 100%, 39%)` -> The primary brand driver. Used for active states, primary actions, and branding.
* `color-secondary-pln` (PLN Midnight Blue): `#002244` / `hsl(215, 100%, 14%)` -> Used for permanent layout structures (sidebars, structural navigation).
* `color-accent-pln` (PLN Yellow Power): `#FFC700` / `hsl(46, 100%, 51%)` -> The AI activation, high-order highlights, and interaction pop color.

### 1.2 Theme Variable Mapping (shadcn/ui Spec)

#### Light Mode

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  
  --primary: 202 100% 39%;            /* #007DBC */
  --primary-foreground: 210 40% 98%;
  
  --secondary: 215 100% 14%;          /* #002244 */
  --secondary-foreground: 210 40% 98%;
  
  --accent: 46 100% 51%;              /* #FFC700 */
  --accent-foreground: 222.2 84% 4.9%;
  
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 202 100% 39%;
  --radius: 0.5rem;
}
```

#### Dark Mode

```css
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  
  --primary: 202 100% 45%;            /* Adjusted for Dark Contrast */
  --primary-foreground: 222.2 84% 4.9%;
  
  --secondary: 215 100% 18%;
  --secondary-foreground: 210 40% 98%;
  
  --accent: 46 100% 51%;              /* #FFC700 Stays Solid */
  --accent-foreground: 222.2 84% 4.9%;
  
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 202 100% 45%;
}
```

---

## 2. Typography & Hierarchy

Enforce an information-dense, modern sans-serif stack optimized for command panels and system dashboards.

* **Primary Font**: `Geist Sans`, `Inter`, sans-serif.
* **Monospace (AI/Logs)**: `Geist Mono`, monospace.

### 2.1 Scale Application Rules
* **Page Title**: `text-3xl font-bold tracking-tight` -> Max 1 per screen context.
* **Section/Widget Header**: `text-xl font-semibold tracking-tight`.
* **Interactive / Form Labels**: `text-sm font-medium`.
* **Table Data / Core Content**: `text-sm font-normal`.
* **Metadata / OSH Indicators**: `text-xs font-medium uppercase`.

---

## 3. Component Architecture Guidelines (shadcn/ui Minimalist Style)

AI must compose interfaces using primitive unstyled logic (Radix) wrapped in utility classes. No heavy shadows or floating cards. Flat, crisp borders only.

### 3.1 Buttons (`Button`)

* **Default/Primary**: Flat `bg-primary text-primary-foreground hover:bg-primary/90`. Rounded corners at `rounded-md`.
* **Secondary/Structural**: `bg-secondary text-secondary-foreground hover:bg-secondary/80`.
* **AI Integration Trigger**: `border border-accent bg-transparent text-foreground hover:bg-accent/10`. Must features an inline spark/bolt icon.

### 3.2 Containers & Board Cards (`Card`)

* **Layout**: `rounded-lg border bg-card text-card-foreground shadow-none`.
* **Interaction**: Hover effects must use a subtle border color shift (`hover:border-primary/50`), never an increase in shadow.

### 3.3 Semantic Safety Status (OSH Level Badges)

For the OSH real-time status display modules, utilize high-contrast muted fills:

* **Low (Safe/Standard)**: `bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20`
* **Mid (Caution/Operator Action)**: `bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20`
* **High (Critical Security/K3 Deployment)**: `bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20`

---

## 4. Layout Structural Conventions

* **Global Layout Grid**: Single persistent sidebar layout (`/admin/*`) utilizing `bg-secondary` for a commanding, secure structure.
* **Header Navigation**: Glassmorphism blur `bg-background/95 backdrop-blur` with a solid 1px bottom border (`border-b`).
* **Real-time Kiosk Mode Layout**: Full viewport (`h-screen w-screen overflow-hidden p-6`), removing all scrollbars. Content must scale dynamically based on orientation meta fields.

---

## 5. AI Reasoning & Verification Instructions

When building or updating UI screens under this design system, the AI Agent must execute this verification check before committing the code:

1. Ensure all primary dashboard action buttons leverage the `bg-primary` (PLN Blue).
2. Validate that no explicit color hex code is hardcoded into the component files. All styling must call semantic HSL tokens (`var(--primary)`, `var(--accent)`, etc.).
3. Confirm that the dark-mode text colors pass the contrast verification checks against `var(--background)`.
