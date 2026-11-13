---
name: tailwind-shadcn
description: Use when building or reviewing Tailwind CSS v4 styles and shadcn/Base UI components in a Next.js FSD application or a shared UI package.
---

# Tailwind + shadcn Guide

## Class names

- Use a plain string for static classes.
- Use `cn()` only for conditional classes or when merging an external `className` prop.
- Keep related classes in one string. Extract a class set to `ui/styles.ts` in the owning slice only when several places repeat it.
- Let the formatter (`prettier-plugin-tailwindcss`) order classes; do not reorder them by hand.

```tsx
// Incorrect: cn() without a condition
<div className={cn('flex items-center gap-2')} />

// Correct
<div className="flex items-center gap-2" />
<div className={cn('flex gap-2', isActive && 'bg-primary')} />
<Button className={cn('rounded-lg px-4', className)} />
```

## Tokens

- Tailwind v4 tokens live in `@theme` (`--color-background` becomes `bg-background`). Use tokens instead of hard-coded colors, spacing, or radii; add a missing token to `@theme` first.
- A single app owns one global style entry, `src/_app/styles/globals.css`. Do not add another global stylesheet.
- In a Turborepo, shared tokens and `@source` paths live in the shared Tailwind package's stylesheet. Each app's `globals.css` imports it first, then overrides only app-specific `@theme` values.

## Ownership

- `cn()` lives in `shared/lib` of a single app, or in the shared UI package of a Turborepo.
- shadcn primitives keep their upstream kebab-case filenames and named exports: in `src/shared/ui` of a single app, or in the shared UI package of a Turborepo.
- Domain components such as cards and forms belong to their FSD slice (`entities/*/ui`, `features/*/ui`), not to `shared/ui` or the UI package.
- Set app fonts once in the root layout; do not set the font again in feature components.

Run the project's formatter and lint command after changing classes or UI components.
