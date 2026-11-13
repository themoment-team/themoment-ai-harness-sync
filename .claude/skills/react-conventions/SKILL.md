---
name: react-conventions
description: Use when writing or reviewing React and TypeScript code in a Next.js project — file and type naming, interface vs type, enum replacement, component shape and export style, ordering inside a component, client boundaries, and import order.
---

# React + TypeScript Conventions

These rules apply to `.ts` and `.tsx` files in a Next.js project. If the project's instructions or lint configuration say otherwise, follow the project and report the difference. Rules marked **(lint)** are usually enforced by ESLint or Prettier; trust the tool output over manual judgment for those.

## Naming

| What                    | Rule                   | Example                            |
| ----------------------- | ---------------------- | ---------------------------------- |
| slice folder            | kebab-case             | `user-profile/`                    |
| component file          | PascalCase             | `ui/HomePage.tsx`                  |
| hook, util, other files | camelCase              | `getQueryClient.ts`, `cn.ts`       |
| props type              | PascalCase + `Props`   | `HomePageProps`                    |
| other types             | PascalCase + `Type`    | `ApiErrorType`, `UserResponseType` |
| request type            | PascalCase + `ReqType` | `UpdateProfileReqType`             |
| Zod schema              | PascalCase + `Schema`  | `EnvSchema`, `UpdateProfileSchema` |

## Types

- Use `interface` for object shapes and `type` for unions and combinations.
- Do not use `enum`. Use a literal union with an `as const` object or a `Record`. **(lint)**
- Import types with `import type`. **(lint)**

## Components

- Write components as arrow functions and destructure props.
- A slice's component file default-exports the component, and the owning slice's `index.ts` re-exports it by name:

  ```tsx
  // src/_pages/home/ui/HomePage.tsx
  interface HomePageProps {
    title: string;
  }

  const HomePage = ({ title }: HomePageProps) => <h1>{title}</h1>;

  export default HomePage;

  // src/_pages/home/index.ts
  export { default as HomePage } from './ui/HomePage';
  ```

- Order inside a component: variables and hooks → handlers and other logic → `useEffect` (only when needed) → `return`.
- Do not add state or effects just to follow this order. When React Compiler is enabled, do not add memoization by hand.
- Accessibility: connect a label to every input, use the right element for buttons and links, and give images `alt`.

## Server and client

- Components are Server Components by default. Add `'use client'` only to the smallest component that needs state, events, or browser APIs.
- Client components do not read server environment variables or import server-only modules.

## Imports

- Order: `react` → `next` → external packages → `@/` → relative paths. **(lint)**
- Outside a slice, import only from its public `index.ts` (or `index.server.ts`).

Run the project's lint, type check, and formatter after changes. The `frontend-convention-validator` agent reviews the rules that tools do not check.
