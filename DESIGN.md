---
name: FireScope AI
description: A light research atlas for inspectable satellite fire observations.
colors:
  primary: "#c64212"
  primary-hover: "#aa350c"
  viirs: "#087f82"
  canvas: "#f7f7f8"
  surface: "#fff"
  raised: "#f4f5f6"
  ink: "#242930"
  muted: "#646b75"
  line: "#e5e7eb"
  field-line: "#dfe2e6"
  active-wash: "#fff0e9"
  active-ink: "#ac3c13"
  warning: "#8b5416"
  error: "#b42318"
typography:
  headline:
    fontFamily: "'Geist Variable', 'Helvetica Neue', sans-serif"
    fontSize: "clamp(28px,2.5vw,36px)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-.035em"
  title:
    fontFamily: "'Geist Variable', 'Helvetica Neue', sans-serif"
    fontSize: "17px"
    fontWeight: 600
    letterSpacing: "-.025em"
  body:
    fontFamily: "'Geist Variable', 'Helvetica Neue', sans-serif"
    fontSize: "13px"
    fontWeight: 400
  label:
    fontFamily: "'Geist Variable', 'Helvetica Neue', sans-serif"
    fontSize: "12px"
    fontWeight: 550
rounded:
  tag: "4px"
  map-control: "6px"
  control: "7px"
  inset: "8px"
  panel: "10px"
spacing:
  compact: "8px"
  field: "10px"
  panel-gap: "16px"
  panel: "18px"
  page: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "9px 13px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "#3c444f"
    rounded: "{rounded.control}"
    padding: "9px 13px"
    height: "40px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 10px"
    height: "40px"
  navigation-active:
    backgroundColor: "{colors.active-wash}"
    textColor: "{colors.active-ink}"
    rounded: "{rounded.control}"
    padding: "10px 11px"
  chip:
    backgroundColor: "{colors.raised}"
    textColor: "#656e78"
    rounded: "{rounded.tag}"
    padding: "5px 7px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
---

# Design System: FireScope AI

## Overview

**Creative North Star: "The Research Atlas"**

A light, map-led scientific workspace makes geographic evidence the focus. White surfaces, neutral gray rules, charcoal typography and restrained orange actions support a precise, approachable research environment. The interface keeps observations, source context and inspectable methods close together.

This records the user-authorized replacement visual world. Current visual authority is the final-imported `src/atlas.css`, supported by `src/App.tsx` and the direction contract in `index.html`. It supersedes earlier navy and Source Sans visual guidance, including older brand styling in PRODUCT.md; product capabilities and scientific limits remain intact.

**Key Characteristics:**
- White research surfaces and quiet dividing rules.
- Self-hosted Geist with compact labels and prominent numerical summaries.
- Orange MODIS squares and teal VIIRS circles.
- Exposed filters, a dominant map and an adjacent source inspector.

## Colors

Signal colors distinguish actions and sensor categories against a neutral workspace.

### Primary
- **Signal Orange:** primary actions, MODIS marks, focus outlines and selected navigation cues.
- **Deep Orange:** primary-button hover.
- **Orange Wash / Orange Ink:** active navigation and related selected states.

### Secondary
- **Evidence Teal:** VIIRS marks, comparison states and polygon boundaries. It is a sensor cue, not a safety verdict.

### Neutral
- **Paper:** panels, top bar, fields and navigation.
- **Quiet Canvas:** the page around panels.
- **Inset Gray:** understated tags and contextual insets.
- **Charcoal / Slate:** primary and explanatory text.
- **Rule Gray / Field Gray:** surface and control boundaries.

Warning and error colors accompany textual notices. Counts, labels and shapes carry meaning alongside color.

**The Sensor Pair Rule.** Preserve orange MODIS squares and teal VIIRS circles across map, legend, summaries and comparisons.

## Typography

**Display Font / Body Font:** Geist Variable, self-hosted through the bundled font package, with Helvetica Neue and sans-serif fallbacks. There is no separate display or mono family.

### Hierarchy
- **Headline:** the frontmatter headline role; phone page headings use (29px).
- **Title:** the frontmatter title role; panel headings range from (12px) to (17px), with larger reading-section headings.
- **Body:** the frontmatter body role; paragraphs generally use line height (1.7). Methods and guide reading content use (14px), with methods line height (1.85).
- **Label:** common controls use the frontmatter label role. Metadata uses (11px) or (12px); desktop rail links use (13px).
- **Numbers:** overview counts use (29px), weight (600), tracking (-.035em) and tabular numerals. Inspector totals use (31px).

## Layout

Desktop uses a left rail (230px), top bar (65px), workspace maximum width (1760px) and page padding (31px 32px 0). Exposed filters precede a four-column summary strip. The map fills the flexible column beside an inspector (255px), separated by (16px). Timeline and study-entry surfaces repeat that column relationship below.

At minimum width (1600px), horizontal padding grows to (42px), the inspector to (285px) and map height to (490px), from its default (432px). At maximum width (1200px), the rail becomes (206px), horizontal padding (24px) and inspector (230px). At (1050px), the rail becomes an icon column (72px). Manual collapse also uses (72px).

At (820px), the inspector follows the map, the summary uses two columns and filters reflow to three columns. At (600px), navigation becomes a horizontal scrolling row, page padding becomes (16px), filters use two columns and map height becomes (360px). Main controls become (44px) high; compact data-options controls remain an exception. Tables retain scrolling regions and native structure.

## Elevation & Depth

Most surfaces are flat: white backgrounds, thin borders and pale selected fills establish hierarchy. Shadows are reserved for floating search results, map tooltips, help popovers, export menus and the guided tour.

### Shadow Vocabulary
- **Search results** (`0 12px 30px #24293012`): geographic suggestions.
- **Map tooltip** (`0 4px 15px #24293012`): source inspection over geography.
- **Guided tour** (`0 14px 45px #24293026`): temporary instructional overlay.

Buttons transition colors and borders over (160ms). On view changes, the introduction moves from (10px) below and opacity (.65) to rest over (.5s), using GSAP `power3.out`. Reduced-motion preferences bypass the introduction and reduce CSS motion.

## Shapes

Gently curved panels, tighter controls and compact tags follow the frontmatter radii. Thin (1px) borders and internal dividers provide structure. The flame tile has (10px) corners; team avatars are circular. Sensor geometry carries categorical meaning.

## Components

### Buttons

Compact and direct. Primary actions use white text on Signal Orange; secondary actions use paper with a Field Gray stroke. Shared minimum height is (40px), increasing to (44px) on phones for main controls. Hover darkens primary orange or gives secondary controls a gray fill. Focus uses an orange outline (2px), offset (3px). Smaller guided-demo and disclosure controls retain local sizing; this does not assert universal target-size compliance.

### Chips

Quiet contextual labels use Inset Gray, compact corners and padding. Sensor names remain visible beside shape and color cues. State labels describe the actual data, including raw observations and sampled historical study status.

### Cards / Containers

Paper panels use Rule Gray borders and panel corners. Map headings have a bottom divider. The inspector uses (18px) padding by default. The summary is one shared container with internal separators rather than four independent cards.

### Inputs / Fields

Native dates, selects and search fields retain visible labels. Fields use paper, a Field Gray stroke, control corners and orange keyboard focus. Hover strengthens the border. Invalid requests use adjacent textual notices; errors retain previous observations when available.

### Navigation

Grouped icon-and-text rows distinguish workspace tools from research tools. Active rows use Orange Wash, Orange Ink and an orange dot; `aria-current` identifies the selected page. Icon-only layouts retain explicit names. Phone navigation scrolls horizontally.

### Geographic Evidence and Inspector

The OpenStreetMap basemap supplies geographic context with attribution preserved. Nearby observation marks aggregate into clusters exposing counts and sensor composition. The inspector carries selected observations or selection summaries, provenance and uncertainty. Calendar and study tools inherit the light surfaces; intensity describes observations or selected measures, never severity or verified risk.

Layers offers opt-in NASA GIBS MODIS Terra true-color imagery linked to the selected UTC day, or the range start when no day is selected, with a visible date, tile-loading status and NASA attribution. Daily imagery supplies visual context; clouds and missing or blank coverage can obscure the surface and do not establish an absence of burning.

### Historical Archive & Burned Area

The Activity calendar includes a separate retrospective comparison with labeled native year and research-area selects. A semantic monthly table with a caption and row/column headers sits in a keyboard-focusable horizontal scrolling region. MODIS and VIIRS detection counts remain separate from mapped burned area in km². Adjacent notes explain missing source tiles, valid-land coverage, shortened mapping periods and the limits of comparison; unavailable area stays unavailable. Monthly comparison and daily-history CSV exports, a source-manifest download and a sources/calculation disclosure keep provenance and quality context inspectable. Loading a month replaces the active workspace observations while the frozen calibration study stays separate.

## Do's and Don'ts

### Do:
- Do preserve sensor names alongside orange squares and teal circles.
- Do keep source, UTC, coverage and synthetic-data context beside results.
- Do keep keyboard focus visible and tables usable in scrolling regions.
- Do reserve shadows for floating context and use borders for resting panels.

### Don't:
- Don't present observation totals as distinct wildfire counts.
- Don't present calendar intensity as severity or missing observations as confirmed absence of burning.
- Don't imply validated harmonization, independently verified accuracy or operational alerts through visual status cues.
- Don't reintroduce the superseded navy and Source Sans visual world as the current system.
