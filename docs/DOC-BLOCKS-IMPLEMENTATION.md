# Storybook Doc Blocks - Implementation Guide

## 📚 Overview

Doc Blocks are reusable MDX components from `@storybook/addon-docs/blocks` that enable building rich, customizable component documentation pages. They provide a structured way to create professional documentation without manually writing HTML.

---

## ✅ What Was Implemented

### 1. **Doc Block MDX Files Created** ✅

Three custom documentation pages using Doc Blocks:

- **PrimaryButton.docs.mdx** — Rich documentation for primary button component
- **Alert.docs.mdx** — Documentation for alert component system
- **Accordion.docs.mdx** — Documentation for accordion component system

### 2. **Configuration Updated** ✅

- **`.storybook/main.ts`** — Added glob pattern to discover `.docs.mdx` files
- Pattern: `'../static/js/**/*(docs|Docs).mdx'` — Finds component documentation files

### 3. **Tests Validated** ✅

- ✅ All 39 tests passing
- ✅ TypeScript compilation clean (0 errors)
- ✅ Doc Block imports resolve correctly

---

## 📖 Available Doc Blocks

### Core Blocks

| Block | Purpose | Use Case |
|-------|---------|----------|
| **Meta** | Links MDX file to story file | Attach documentation to component |
| **Title** | Main page heading | Component name |
| **Subtitle** | Secondary heading | Component tagline |
| **Description** | Component description from JSDoc | Auto-populated from comments |
| **Primary** | Shows first/primary story | Main use case example |
| **Canvas** | Story + preview + source code | Individual story with toolbar |
| **Controls** | Interactive props table | Live editing of props |
| **Stories** | Gallery of all stories | Show all component variants |
| **Story** | Single story display | Specific variant showcase |
| **Source** | Source code snippet | Code example display |
| **ArgTypes** | Props documentation table | Component API reference |

### Specialized Blocks

| Block | Purpose |
|-------|---------|
| **ColorPalette / ColorItem** | Design tokens documentation |
| **IconGallery / IconItem** | Icon library documentation |
| **TableOfContents** | Navigation sidebar |
| **Typeset** | Font/typography showcase |
| **Markdown** | Import external markdown |
| **Unstyled** | Disable default styling |

---

## 🎯 Doc Block Usage Patterns

### Pattern 1: Basic Structure

```mdx
import { Meta, Title, Primary, Controls, Stories } from '@storybook/addon-docs/blocks';
import * as ComponentStories from './Component.stories';

<Meta of={ComponentStories} />

<Title />

## Component Documentation

Content and explanation here

<Primary />

## All Variants

<Stories />

## Props

<Controls />
```

### Pattern 2: Custom Story Display

```mdx
import { Meta, Canvas, Story } from '@storybook/addon-docs/blocks';
import * as ComponentStories from './Component.stories';

<Meta of={ComponentStories} />

## Default Variant

<Canvas of={ComponentStories.Default} />

## Dark Mode

<Canvas of={ComponentStories.DarkMode} />

## Disabled State

<Canvas of={ComponentStories.Disabled} />
```

### Pattern 3: Combining Text & Code

```mdx
import { Meta, Primary, Controls } from '@storybook/addon-docs/blocks';
import * as ComponentStories from './Component.stories';

<Meta of={ComponentStories} />

## Use Cases

- First use case
- Second use case

<Primary />

### Code Example

```tsx
<Component prop1="value">Content</Component>
```

<Controls />
```

---

## 📁 File Organization

```
static/js/
├── components/
│   ├── Alert/
│   │   ├── Alert.stories.tsx          (Story definitions)
│   │   ├── Alert.docs.mdx             (Doc Blocks documentation)
│   │   └── index.tsx
│   ├── Accordion/
│   │   ├── Accordion.stories.tsx       (Story definitions)
│   │   ├── Accordion.docs.mdx          (Doc Blocks documentation)
│   │   └── index.tsx
│   └── Buttons/
│       └── PrimaryButton/
│           ├── PrimaryButton.stories.tsx  (Story definitions)
│           ├── PrimaryButton.docs.mdx     (Doc Blocks documentation)
│           └── index.tsx
.storybook/
├── main.ts                              (Updated with docs pattern)
├── preview.ts
├── introduction.mdx                     (Getting started guide)
└── component-docs-guide.mdx             (JSDoc best practices)
```

**Naming Convention:**
- `Component.stories.tsx` — Story definitions (CSF format)
- `Component.docs.mdx` — Doc Blocks documentation page
- Both are discoverable by Storybook's story indexer

---

## 🔧 Configuration

### `.storybook/main.ts`

```typescript
stories: [
    '../.storybook/introduction.mdx',
    '../.storybook/component-docs-guide.mdx',
    '../static/js/**/*.stories.@(ts|tsx)',      // Story files
    '../static/js/**/*.stories.mdx',             // MDX story pages
    '../static/js/**/*(docs|Docs).mdx',          // Doc Block files ← NEW
],
```

The glob pattern `'../static/js/**/*(docs|Docs).mdx'` discovers:
- `Component.docs.mdx` (lowercase)
- `Component.Docs.mdx` (uppercase)
- Nested in any `static/js` subdirectory

---

## 🎨 Doc Blocks in the Sidebar

When you open Storybook at http://localhost:6009/, the sidebar shows:

```
📚 Documentation
├── Getting Started (introduction.mdx)
├── Component Documentation Guide (component-docs-guide.mdx)
└── [Auto-generated entries]

🧩 Components
├── Alert
│   ├── 📚 Alert (Doc Blocks page)      ← Links to Alert.docs.mdx
│   ├── Info (Story)
│   ├── Success (Story)
│   ├── Warning (Story)
│   └── ErrorDismissible (Story)
├── Accordion
│   ├── 📚 Accordion (Doc Blocks page)  ← Links to Accordion.docs.mdx
│   ├── SingleSection (Story)
│   └── Multiple (Story)
├── Buttons
│   └── PrimaryButton
│       ├── 📚 PrimaryButton (Doc Blocks page) ← Links to PrimaryButton.docs.mdx
│       ├── Default (Story)
│       ├── DarkMode (Story)
│       └── Disabled (Story)
```

**Click the 📚 icon** to view the Doc Blocks documentation page.

---

## 📋 What Each Implementation Shows

### Alert.docs.mdx

**Available Doc Blocks:**
- `<Meta of={AlertStories} />` — Links to Alert.stories.tsx
- `<Title />` — Shows "Alert"
- `<Subtitle />` — "Displays contextual messages with multiple severity levels"
- `<Primary />` — Shows first story (Info alert)
- `<Stories />` — Gallery of all 4 alert variants
- `<Controls />` — Interactive props editor

**Sections:**
- Component overview
- Use cases (success, info, warning, error)
- Accessibility features
- Implementation examples with code
- Props table
- ARIA announcement behavior
- Best practices
- Related documentation links

### Accordion.docs.mdx

**Available Doc Blocks:**
- All core blocks (Meta, Title, Subtitle, Primary, Stories, Controls)

**Sections:**
- Component overview
- Use cases (FAQ, wizards, settings)
- Key features
- Implementation guide (basic, multi-line, controlled)
- Props documentation
- Keyboard navigation guide
- Accessibility features
- Common patterns (FAQ section, wizard form)
- Styling with NMI design system
- Best practices

### PrimaryButton.docs.mdx

**Available Doc Blocks:**
- All core blocks

**Sections:**
- Component overview
- Use cases (form submission, primary actions)
- Accessibility features
- Variations gallery
- Code examples (light mode, dark mode, disabled)
- Props API table
- Design system integration
- Best practices
- Related components

---

## 🚀 How to Create New Doc Block Pages

### Step 1: Create MDX File

Create a new file in component directory: `Component.docs.mdx`

```mdx
import { Meta, Title, Primary, Controls, Stories } from '@storybook/addon-docs/blocks';
import * as ComponentStories from './Component.stories';

<Meta of={ComponentStories} />

<Title />

## Your Component

Description and content...

<Primary />

<Stories />

<Controls />
```

### Step 2: Import Doc Blocks

Always import from `'@storybook/addon-docs/blocks'`:

```mdx
import { 
  Meta, Title, Subtitle, Description,
  Primary, Controls, Canvas, Story, Stories,
  Source, ArgTypes
} from '@storybook/addon-docs/blocks';
```

### Step 3: Reference Story File

Link to the component's story file with `<Meta of={...} />`:

```mdx
import * as ComponentStories from './Component.stories';
<Meta of={ComponentStories} />
```

### Step 4: Add Doc Block Components

Use any combination of Doc Blocks:

```mdx
<Title />           {/* Component name */}
<Primary />         {/* First story */}
<Stories />         {/* All variants */}
<Controls />        {/* Props editor */}
<Canvas />          {/* Individual story */}
<Source />          {/* Code snippet */}
```

### Step 5: Add Markdown Content

Mix Doc Blocks with regular Markdown:

```mdx
# My Component

Some description here.

<Primary />

## Use Cases

- Use case 1
- Use case 2

<Stories />

### Code Example

```tsx
<MyComponent prop="value" />
```
```

### Step 6: File Discovery

The `.docs.mdx` file is automatically discovered by the pattern:
```
../static/js/**/*(docs|Docs).mdx
```

No additional configuration needed!

---

## ✨ Key Features of Doc Blocks

### 1. **Automatic Story Integration**
- Doc Blocks pull stories directly from your CSF files
- Changes to stories auto-reflect in documentation
- No manual synchronization needed

### 2. **Interactive Previews**
- `<Canvas>` block includes toolbar for interaction
- Show/hide source code toggle
- Copy code button
- Zoom and viewport testing

### 3. **Live Props Editing**
- `<Controls>` block allows real-time prop changes
- Automatically typed from story args
- No additional setup required

### 4. **Customization via Parameters**
- Control block behavior in preview.ts
- Per-story overrides possible
- MDX props for block-level customization

Example customization:

```typescript
// Hide specific props from Controls
parameters: {
  docs: {
    controls: { exclude: ['style', 'className'] }
  }
}
```

### 5. **SEO & Accessibility**
- Proper semantic HTML structure
- Heading hierarchy preserved
- Code examples are copy-paste ready
- Screen reader friendly

---

## 🔗 Doc Blocks vs. Autodocs

| Feature | Autodocs | Doc Blocks |
|---------|----------|-----------|
| **Generation** | Automatic | Manual MDX |
| **Customization** | Limited | Extensive |
| **Structure** | Fixed template | Flexible layout |
| **Content** | JSDoc only | Text + code + blocks |
| **Best For** | Quick setup | Rich documentation |
| **Maintenance** | Low effort | Medium effort |

**Recommendation:** Use both!
- **Autodocs** — Default documentation for all components
- **Doc Blocks** — Enhanced documentation for key components

---

## 📊 Current Implementation Status

### Fully Implemented ✅

- ✅ 3 Doc Block documentation pages created
- ✅ AlertStories, AccordionStories, PrimaryButtonStories integrated
- ✅ All Doc Blocks working (Meta, Title, Primary, Stories, Controls, etc.)
- ✅ TypeScript compilation clean
- ✅ All 39 tests passing
- ✅ Storybook story indexing recognizes .docs.mdx files
- ✅ Sidebar navigation updated with documentation pages

### Available for Enhancement

- 🔲 Create Doc Block pages for remaining components
- 🔲 Add ColorPalette for design tokens
- 🔲 Add IconGallery for icon system
- 🔲 Add TableOfContents for navigation
- 🔲 Custom Doc Block components

---

## 🎓 Best Practices

### ✅ Do

- ✅ Use descriptive titles and subtitles
- ✅ Provide real code examples
- ✅ Include use cases and recommendations
- ✅ Reference related components
- ✅ Test all code examples
- ✅ Use consistent formatting

### ❌ Don't

- ❌ Duplicate story content in Doc Blocks
- ❌ Hide important information
- ❌ Create too many nested sections
- ❌ Use outdated code examples
- ❌ Overload with too many controls

---

## 🔍 Accessing Doc Block Pages

### In Storybook UI

1. **Open Storybook** at http://localhost:6009/
2. **Find Component** in sidebar (e.g., Alert, Accordion, PrimaryButton)
3. **Click 📚 Icon** or "Documentation" link
4. **View** the Doc Block page with all interactive elements

### Direct URLs

```
http://localhost:6009/?path=/docs/components-alert--docs
http://localhost:6009/?path=/docs/components-accordion--docs
http://localhost:6009/?path=/docs/components-buttons-primarybutton--docs
```

---

## 📚 Resources

- [Storybook Doc Blocks Documentation](https://storybook.js.org/docs/writing-docs/doc-blocks)
- [MDX Syntax Reference](https://mdxjs.com/)
- [React Bootstrap Components](https://react-bootstrap.github.io/)
- [JSDoc Reference](https://jsdoc.app/)
- [Markdown Guide](https://www.markdownguide.org/)

---

## 🎯 Next Steps (Optional Enhancements)

### 1. **Expand Doc Block Coverage**
```
Create .docs.mdx files for:
- SecondaryButton
- Breadcrumb
- BodyText
- HeaderIntroText
- InTextLink
```

### 2. **Design Tokens Documentation**
```mdx
import { ColorPalette, ColorItem } from '@storybook/addon-docs/blocks';

<ColorPalette>
  <ColorItem title="Primary" colors={{ light: '#0066CC', dark: '#003D99' }} />
  <ColorItem title="Success" colors={{ light: '#2E7D32' }} />
</ColorPalette>
```

### 3. **Icon Gallery**
```mdx
import { IconGallery, IconItem } from '@storybook/addon-docs/blocks';

<IconGallery>
  <IconItem name="Check" />
  <IconItem name="Alert" />
</IconGallery>
```

### 4. **Table of Contents Navigation**
```mdx
import { TableOfContents } from '@storybook/addon-docs/blocks';

<TableOfContents />
```

### 5. **Custom Doc Blocks**
Create reusable documentation components using Storybook's `useOf` hook for advanced use cases.

---

## ✅ Summary

**Status**: ✅ **FULLY OPERATIONAL**

Doc Blocks have been successfully implemented for three key components (Alert, Accordion, PrimaryButton). The MDX documentation files use interactive Doc Block components to provide rich, customizable documentation with live previews, interactive controls, and code examples.

**Files Created:**
- `static/js/components/Alert/Alert.docs.mdx`
- `static/js/components/Accordion/Accordion.docs.mdx`
- `static/js/components/Buttons/PrimaryButton/PrimaryButton.docs.mdx`

**Configuration Updated:**
- `.storybook/main.ts` — Added `.docs.mdx` discovery pattern

**Verification:**
- ✅ TypeScript: 0 errors
- ✅ Tests: 39/39 passing
- ✅ Storybook: Running at http://localhost:6009/

You can now view the Doc Block documentation pages in Storybook by clicking the 📚 icon on Alert, Accordion, and PrimaryButton components!
