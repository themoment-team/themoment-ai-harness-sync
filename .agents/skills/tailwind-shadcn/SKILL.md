---
name: tailwind-shadcn
description: Use when building or reviewing Tailwind CSS v4 styles and shadcn/Base UI components in a Next.js FSD application or a shared UI package.
---

# Tailwind + shadcn Guide

## Class names

- Use a plain string for static classes.
- Use `cn()` only for conditional classes or when merging an external `className` prop.
- Keep related classes in one string. When several places repeat a class set, extract a component; do not move class strings into constants (`styles.ts` and the like).
- Let the formatter (`prettier-plugin-tailwindcss`) order classes; do not reorder them by hand. Add `"tailwindFunctions": ["cva"]` to the Prettier options so strings inside `cva(...)` are sorted too.

```tsx
// Incorrect: cn() without a condition
<div className={cn('flex items-center gap-2')} />

// Correct
<div className="flex items-center gap-2" />
<div className={cn('flex gap-2', isActive && 'bg-primary')} />
<Button className={cn('rounded-lg px-4', className)} />
```

## Variants

Define components with size, color, or state variants with `cva` (class-variance-authority). shadcn primitives already use it; it also works on its own, so add it to projects without shadcn when the first variant component appears.

```tsx
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/lib';

const buttonVariants = cva('inline-flex items-center rounded-md font-medium', {
  variants: {
    variant: { primary: 'bg-primary text-primary-foreground', outline: 'border border-input' },
    size: { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4' },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});

interface ButtonProps extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {}

export const Button = ({ variant, size, className, ...props }: ButtonProps) => (
  <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
);
```

- Derive the variant props with `VariantProps`; do not retype the variant unions by hand.
- `cva` does not resolve conflicting classes. Merge an external `className` through `cn(variants({ ... }), className)`.

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
