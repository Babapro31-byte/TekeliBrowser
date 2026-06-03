# Design System Specification: The Monolithic Web

## 1. Overview & Creative North Star
**Creative North Star: The Silent Sentinel**

The digital landscape is often cluttered and invasive. This design system rejects the "noise" of modern web browsing in favor of a monolithic, utility-first experience. It is inspired by the architectural philosophy of Brutalism, softened by high-end editorial precision. We move away from the "browser as a portal" toward the "browser as a tool." 

To break the standard template feel, this system utilizes **intentional asymmetry** and **tonal depth**. The UI does not compete for attention; it recedes into the background, allowing content to take center stage. We achieve a premium feel through high-contrast typography scales and rigid, yet slightly humanized, square geometries (`DEFAULT: 0.25rem`).

---

## 2. Colors
Our palette is a study in obsidian and graphite. We prioritize functional visibility over decorative flair.

### The "No-Line" Rule
Sectioning must be achieved through tonal shifts rather than 1px solid borders. For example, a navigation bar should be defined by `surface-container-high` sitting against a `surface` background. Structural boundaries are felt, not seen.

### Surface Hierarchy & Nesting
Treat the interface as a physical stack of matte materials:
- **Base Layer:** `surface` (#0e0e10) for the primary application background.
- **Structural Elements:** `surface-container-low` (#131316) for sidebars or inactive tab areas.
- **Active Interactive Zones:** `surface-container-highest` (#25252b) for active URL bars or focused search inputs.
- **The Glass & Gradient Rule:** Use semi-transparent variants of `primary-container` with a `backdrop-blur` for floating modals to maintain a sense of environmental continuity. For primary CTAs, a subtle linear gradient from `primary` (#c6c6cf) to `secondary` (#9f9da1) adds a "machined metal" finish.

---

## 3. Typography
We utilize **Inter** across the entire system to ensure maximum legibility and a neutral, systematic tone.

- **Display & Headline:** Used exclusively for high-level dashboard metrics or search focus states. High-contrast sizing (e.g., `display-lg` at 3.5rem) against small `label-sm` metadata creates an editorial, high-end feel.
- **Body & Labels:** `body-md` (0.875rem) is our workhorse for web content. All browser UI elements (tabs, URL text) utilize `label-md` to maintain a compact, utility-focused footprint.
- **Brand Identity:** The typographic hierarchy conveys "Authority through Silence." By keeping interface text small and monochrome (`on_surface_variant`), we emphasize the user's content over the browser's chrome.

---

## 4. Elevation & Depth
Depth in this system is achieved through **Tonal Layering**, not structural shadows.

- **The Layering Principle:** Instead of a drop shadow, a "raised" card is simply a `surface-container-highest` block resting on a `surface` background.
- **Ambient Shadows:** For floating context menus, use an ultra-diffused shadow: `box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5)`. The shadow must feel like an occlusion of light, not a printed line.
- **The "Ghost Border" Fallback:** If a border is required for accessibility, use `outline-variant` at 15% opacity. This creates a "hairline" effect that suggests a boundary without interrupting the monolithic aesthetic.
- **Glassmorphism:** Active tab states or overlay panels should use `surface-variant` with a 60% alpha and a 12px blur to simulate frosted privacy glass.

---

## 5. Components

### URL & Search Input
- **Style:** Square corners (`sm: 0.125rem`). Background: `surface_container_highest`. 
- **States:** On focus, the border-less container transitions to a `primary` ghost-border (20% opacity). No glow, no AI icons.
- **Typography:** `title-sm`.

### Buttons (Back, Home, Close)
- **Primary:** Background `primary`, text `on_primary`. Sharp corners.
- **Secondary/Utility:** Ghost buttons using `on_surface_variant` icons. No background container unless hovered. On hover, use `surface_bright` with a 200ms ease-in-out.
- **Close Button:** Subtle `error_dim` on hover to signal destructive action without being garish.

### Tabs
- **Inactive:** `surface_container_low`. No borders.
- **Active:** `surface_container_highest` with a top-accent of `primary` (2px height).
- **Spacing:** Use 12px horizontal padding to allow the typography to breathe.

### Navigation Controls
- **Lists & Menus:** Forbid divider lines. Use `8px` vertical spacing to separate groups.
- **Privacy Indicators:** Use `secondary` for "secure" icons. Only use `error` for critical security failures.

---

## 6. Do's and Don'ts

### Do:
- **Do** use `surface-container-lowest` (#000000) for deep-set elements like the terminal or "private" windows to increase the sense of security.
- **Do** maintain strict alignment. Every element should feel snapped to a 4px or 8px grid.
- **Do** prioritize "Utility over Beauty." If an element doesn't serve a privacy or navigation function, remove it.

### Don't:
- **Don't** use standard 1px borders. Use background color shifts to define space.
- **Don't** use bright, saturated colors. Aside from the `error` state, the UI should remain strictly grayscale.
- **Don't** use AI-generated or "sparkle" iconography. Icons must be clean, geometric, and functional (e.g., Lucide or Phosphor icons in "Regular" weight).
- **Don't** use large corner radii. Stick to `DEFAULT` (0.25rem) or `sm` (0.125rem) to maintain the architectural, professional look.