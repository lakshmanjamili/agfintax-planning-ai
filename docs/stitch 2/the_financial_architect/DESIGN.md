# Design System Document: The Financial Architect

## 1. Overview & Creative North Star

### Creative North Star: "The Financial Architect"
This design system is not merely a collection of UI components; it is a structural blueprint for digital authority. We are moving away from the "generic fintech" aesthetic of flat blue boxes and thick lines toward an environment of **Editorial Sophistication**. 

The "Financial Architect" vision treats the interface like a premium glass-and-steel skyscraper at midnight: transparent, structured, and illuminated by high-tech precision. We break the "template" look through:
*   **Intentional Asymmetry:** Utilizing unbalanced whitespace to guide the eye toward high-value data.
*   **Overlapping Elements:** Breaking the rigid 2D grid by allowing glassmorphic cards to overlap mesh-gradient backgrounds.
*   **High-Contrast Typography Scale:** Juxtaposing massive, elegant display headers with hyper-clean, minimal body copy to mimic high-end financial journals.

The goal is to evoke the feeling of a $1B valuation AI firm—where every pixel feels intentional, expensive, and mathematically sound.

---

## 2. Colors

Our palette is anchored in depth and high-voltage energy. It utilizes Material Design tokens to manage a complex, multi-layered dark mode environment.

### The "No-Line" Rule
**Borders are a failure of hierarchy.** In this system, 1px solid borders for sectioning are strictly prohibited. Boundaries must be defined solely through:
*   **Background Shifts:** Transitioning from `surface` (#131318) to `surface_container_low` (#1B1B20).
*   **Tonal Transitions:** Using subtle variations in depth to signal the start of a new content block.

### Surface Hierarchy & Nesting
Think of the UI as physical layers of smoked glass. Use the container tiers to define importance:
*   **Base:** `surface` (#131318) for the main background.
*   **Sub-sections:** `surface_container_low` (#1B1B20) for secondary content.
*   **Elevated Components:** `surface_container_highest` (#35343A) for primary interactive elements.

### The "Glass & Gradient" Rule
To achieve $1B valuation polish, floating elements (modals, dropdowns, navigation) must use **Glassmorphism**. Apply a semi-transparent `surface_variant` with a backdrop-blur (minimum 16px). 

### Signature Textures
Main CTAs and Hero sections should never be flat. Use a "Mesh Gradient" approach transitioning from `on_primary_container` (#DC5700) to `primary` (#FFB596) to provide a soft, internal glow that mimics 3D lighting.

---

## 3. Typography: Plus Jakarta Sans

We use **Plus Jakarta Sans** for its geometric clarity and tech-forward stance.

*   **Display (lg/md):** Used for "The Hook." Set with tight letter spacing (-0.02em) to feel architectural.
*   **Headline:** Used for section titles. These provide the editorial structure.
*   **Title:** For card headers and high-level navigation.
*   **Body (lg/md/sm):** High-readability weights. Always use `on_surface_variant` (#C7C5D3) for secondary body text to reduce visual noise.
*   **Labels:** Reserved for micro-data, AI tags, and overlines.

The hierarchy is designed to convey **Quiet Confidence.** Large headings command attention, while generous spacing between lines (leading) ensures the "Architectural" feel remains airy and premium.

---

## 4. Elevation & Depth

We eschew "Standard Shadows" for **Tonal Layering.**

*   **The Layering Principle:** Depth is achieved by stacking. A `surface_container_lowest` card placed on a `surface_container_low` background creates a natural recession.
*   **Ambient Shadows:** For floating glass elements, use an extra-diffused shadow. 
    *   *Spec:* `0px 24px 48px rgba(0, 0, 0, 0.4)`. The shadow is a tinted version of the background, never pure black.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline_variant` token at **15% opacity**. It should be felt, not seen.
*   **Glassmorphism & Depth:** By using `surface_variant` at 60% opacity with backdrop-blur, we allow the "Deep Midnight Navy" hues to bleed through, ensuring the UI feels integrated into the environment.

---

## 5. Components

### Buttons (High-Impact)
*   **Primary:** Vibrant Electric Orange gradient (`primary` to `on_primary_container`). Roundedness: `md` (0.375rem).
*   **Secondary:** Glassmorphic fill with a "Ghost Border."
*   **Tertiary:** Text-only using `tertiary` (#4CD6FB) for AI-specific actions.

### Cards & Lists
**Forbid the use of divider lines.** 
*   Separate list items using `spacing.4` (1.4rem) of vertical whitespace.
*   Cards should utilize the **Glass Layer** system: `surface_container_high` with a subtle top-down 1px gradient stroke (from white 10% to white 0%) to simulate a light-catching glass edge.

### 3D AI Components
When displaying AI insights or financial projections, use high-quality 3D icons with "Inner Glow" effects. These should feel like physical objects resting on the glass surface.

### Inputs
*   **State:** Unfocused inputs use `surface_container_lowest`. 
*   **Focus:** Transition to a `tertiary` (#4CD6FB) "Ghost Border" to signal AI-readiness.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use the `24` (8.5rem) spacing token for hero section margins to create "Editorial Breathing Room."
*   **Do** use `secondary_container` (#3B418F) for subtle "Midnight" accents in data visualization.
*   **Do** lean into asymmetry. Place a primary CTA off-center if it balances a large Headline.
*   **Do** use 3D icons as "Architectural Landmarks" to break up text-heavy sections.

### Don't:
*   **Don't** use 100% white (#FFFFFF) for text. Use `on_surface` (#E4E1E9) to maintain the premium dark-mode aesthetic.
*   **Don't** use standard "Drop Shadows" with small blurs. It looks "Cheap/SaaS-like."
*   **Don't** use dividers or "HR" tags. If you need a break, use a background color shift or more whitespace.
*   **Don't** crowd the interface. If it feels busy, increase the spacing to the next scale level (e.g., from `8` to `10`).

---
*Document End.*