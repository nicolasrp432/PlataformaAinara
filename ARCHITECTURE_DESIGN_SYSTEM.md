# Design System Specification - Plataforma Ainara (Premium Edition)
Version: 1.0.0
Phase: 1 - UI/UX Refactoring

## 1. Core Vibe & Strategy
- **Concept**: Premium, Clean, Modern, High-Trust.
- **Style**: Soft Glassmorphism, deep rounded corners, high whitespace, and strict hierarchy.
- **Goal**: Emulate Skool's usability with a high-end visual polish.

## 2. Design Tokens (Tailwind CSS Mapping)

### A. Color Palette
- **Primary (Action)**: 
  - Default: `#7C3AED` (violet-600)
  - Hover: `#6D28D9` (violet-700)
  - Foreground: `#FFFFFF`
- **Backgrounds**:
  - Global Background: `#F9FAFB` (gray-50)
  - Card/Surface: `#FFFFFF` (white)
  - Secondary Surface: `#F3F4F6` (gray-100)
- **Typography/Text**:
  - Heading: `#111827` (gray-900)
  - Body: `#374151` (gray-700)
  - Muted/Secondary: `#6B7280` (gray-500)
- **Borders**:
  - Default Border: `#E5E7EB` (gray-200)

### B. Geometry & Shadows
- **Border Radius**:
  - Cards & Containers: `1rem` (rounded-2xl - 16px)
  - Buttons & Inputs: `0.75rem` (rounded-xl - 12px)
- **Shadows**:
  - Subtle: `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` (shadow-sm)
  - Standard: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` (shadow-md)

### C. Typography
- **Font Family**: Sans-serif geometric (Prioridad: Inter, SF Pro, o Roboto).
- **Scale**:
  - H1: 2.25rem (Bold)
  - H2: 1.5rem (Semibold)
  - Body: 1rem (Regular)

## 3. Component Guidelines (UI Audit)
1. **Cards**: Padding de `1.5rem` (p-6), borde de `1px` sólido gray-200, fondo blanco puro, shadow-sm.
2. **Buttons**: Sin bordes afilados. Transiciones suaves (duration-200). Texto en semibold.
3. **Sidebar**: Fondo blanco, separación clara con borde derecho, iconos en gray-500, estado activo en violet-600 con un fondo sutil violet-50.
4. **Inputs**: Background gray-50 en estado reposo, borde violet-600 en focus.

## 4. Specific Implementation Rules
- Usar exclusivamente variables de CSS en `globals.css` vinculadas a `tailwind.config.ts`.
- No usar colores arbitrarios (no usar `text-[#hex]`). Usar tokens: `text-primary`, `bg-background`, etc.