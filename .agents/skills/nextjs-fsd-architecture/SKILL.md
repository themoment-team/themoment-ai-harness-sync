---
name: nextjs-fsd-architecture
description: Use when placing, structuring, or reviewing code in a Next.js App Router project that follows the official Feature-Sliced Design layout (`src/_app`, `src/_pages`), including Turborepo workspaces that share FSD lower layers through `packages/core`.
---

# Next.js + Feature-Sliced Design Guide

This guide follows the official FSD guide for Next.js. Paths such as `src/`, `app/`, and `@/` are relative to a web app: the project root for a single app, or each `apps/<name>/` folder in a Turborepo. If the project's instructions or existing code use different names, follow the project and report the difference.

## Layout

```text
app/                 Next.js routes only (outside FSD; Steiger does not check it)
src/
├── _app/            app layer: providers, global styles, bootstrap config
├── _pages/          pages layer: one screen per route
├── widgets/         large self-contained blocks shared by screens
├── features/        one user action (a form or button and its mutation)
├── entities/        domain concepts (user, post) and how they are read
└── shared/          domain-agnostic code (api, config, lib, ui)
```

- Next.js treats `src/app` and `src/pages` as router folders, so the FSD `app` and `pages` layers carry a leading underscore. Steiger strips the underscore and recognizes them as layers.
- The root `app/` is for routing only. From the FSD point of view it sits above `_app` and composes everything.
- Import direction is `_app → _pages → widgets → features → entities → shared`. A layer imports only layers to its right, never another slice in the same layer, and never a slice's internal path. `_app` and `shared` have no slices, so their segments may import one another.

## Choosing a layer

Ask from the top and use the first layer that fits.

| Question                                                         | Layer      |
| ---------------------------------------------------------------- | ---------- |
| Does it apply once to the whole app? (providers, global CSS)     | `_app`     |
| Is it the whole screen for one route?                            | `_pages`   |
| Is it a large block used by several screens, combining features? | `widgets`  |
| Is it one thing the user does? (edit profile, like, log out)     | `features` |
| Is it a domain concept and how it is shown or read?              | `entities` |
| Does it know nothing about the domain?                           | `shared`   |

- Starting inside `_pages` is fine. Move code down a layer when a second screen needs it; do not split in advance.
- Steiger's `fsd/insignificant-slice` reports a slice with a single consumer. Consider merging it into that consumer first.
- When a feature needs another feature, compose them in a widget or page.
- Do not put feature-specific code in `shared/`. Global configuration goes in `shared/config`; application bootstrap configuration goes in `_app/config`.

## Slices and segments

- Slice names are kebab-case domain names (`user`, `edit-profile`).
- Name segments by purpose, not by kind. Do not use `components`, `hooks`, `utils`, or `types` (Steiger `fsd/segments-by-purpose`).

| Segment   | Contents                                                  |
| --------- | --------------------------------------------------------- |
| `ui/`     | components, `styles.ts` for repeated class strings        |
| `model/`  | types, schemas, constants, state hooks                    |
| `api/`    | URL constants, request functions, query keys, query hooks |
| `lib/`    | utilities used only by this slice                         |
| `config/` | configuration values and feature flags                    |

Create a segment only when it has code.

## Public API

- Each slice has an `index.ts` that exports, by name, only what other slices use. Code outside the slice imports only from it (Steiger `fsd/no-public-api-sidestep`).
- Server-only code (anything importing `server-only` or the server HTTP client) is exported from a separate `index.server.ts`. Mixing it into `index.ts` breaks the build of any client component that imports the slice.
- Inside a slice, use relative imports.

```ts
// src/entities/user/index.ts
export { useGetUser } from './api/useGetUser';
export { userQueryKeys } from './api/userQueryKeys';
export type { UserResponseType } from './model/types';

// src/entities/user/index.server.ts
export { getUserOnServer } from './api/getUserOnServer';
```

### Cross-entity references (`@x`)

Entities do not import each other. Only when one entity's type is unavoidable in another, the providing entity adds `@x/<consumer>.ts`.

```ts
// src/entities/user/@x/post.ts — public API only for the post entity
export type { UserResponseType } from '../model/types';

// src/entities/post/model/types.ts
import type { UserResponseType } from '@/entities/user/@x/post';
```

A growing number of `@x` files means the entity boundary is wrong: merge the entities or move the composition up a layer.

## Route files

Files under the root `app/` only do what Next.js requires.

| File                                        | Responsibility                                                 |
| ------------------------------------------- | -------------------------------------------------------------- |
| `layout.tsx`                                | `<html>`/`<body>`, `metadata`, providers and global CSS import |
| `page.tsx`                                  | re-export the page component from `_pages`                     |
| `loading.tsx`, `error.tsx`, `not-found.tsx` | render a component from `_pages` or `widgets`                  |
| `route.ts`                                  | Route Handler                                                  |

```tsx
// app/page.tsx
export { HomePage as default } from '@/_pages/home';

// app/users/[id]/page.tsx — params are handled by the async page component in _pages
export { UserPage as default } from '@/_pages/user';
```

- Data prefetching and `HydrationBoundary` belong to the async Server Component in `src/_pages/<slice>/ui/`, not to the route file.
- Keep data shaping, branching, state, event handlers, route guards, and styled markup out of route files. **Steiger does not check the root `app/`**, so review it by hand.

## Server and client

- Components are Server Components by default. Add `'use client'` only to the smallest component that needs state, events, or browser APIs (usually in a feature's `ui/`).
- Read validated server environment variables only on the server. Never import the server env module from a client component.
- Browser requests use the client HTTP module; server requests use the server-only module exported from `index.server.ts`.

## Steiger

1. Enable the harness item in `.harness/sync.yml` to deploy `steiger.config.mjs` to the project root:

   ```yaml
   overrides:
     nextjs/fsd/steiger-config: true
   ```

2. Install `steiger` and `@feature-sliced/steiger-plugin` as development dependencies.
3. Add `"lint:fsd": "steiger ./src --fail-on-warnings"`. Warnings count as failures.

The deployed config adds two exceptions to the recommended rules:

```js
// steiger.config.mjs
import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Underscored layer folders are recognized as layers, but the typo rule compares raw folder names.
    files: ['./src/_app/**', './src/_pages/**'],
    rules: { 'fsd/typo-in-layer-name': 'off' },
  },
  {
    // `providers` is the conventional segment name in the app layer.
    files: ['./src/_app/providers/**'],
    rules: { 'fsd/segments-by-purpose': 'off' },
  },
]);
```

Add another exception only for a real violation where restructuring would be worse, with the narrowest `files` glob and a comment explaining why.

| Rule                         | Meaning                                       | Usual fix                                |
| ---------------------------- | --------------------------------------------- | ---------------------------------------- |
| `fsd/forbidden-imports`      | imports an upper layer or a sibling slice     | compose one layer up, or use `@x`        |
| `fsd/no-public-api-sidestep` | imports a slice's internal path               | export from `index.ts` and import that   |
| `fsd/insignificant-slice`    | slice with a single consumer                  | merge into the consumer                  |
| `fsd/segments-by-purpose`    | segment named by kind (`hooks`, `components`) | rename by purpose (`model`, `lib`, `ui`) |

## Turborepo with several apps

```text
apps/<name>/src:     _app → _pages → widgets → features → entities → shared
packages/core/src:   entities → shared
```

- Apps never import each other. Sharing goes through `packages/*`, and a package is imported only through the entry points in its `package.json` `exports`.
- Keep an entity in the first app that uses it. When a second app needs it, move the slice folder to `packages/core/src/entities` and change imports from `@/entities/<slice>` to `@scope/core/entities/<slice>`.
- `packages/core` has no root barrel. It is exposed in the same units as slice public APIs, so the import path keeps the layer visible:

  ```json
  {
    "exports": {
      "./shared/*": "./src/shared/*/index.ts",
      "./shared/*/server": "./src/shared/*/index.server.ts",
      "./entities/*": "./src/entities/*/index.ts",
      "./entities/*/server": "./src/entities/*/index.server.ts"
    }
  }
  ```

- New segments and slices need no `exports` change. Do not import paths inside a public file (`@scope/core/entities/user/model`); the wildcard also matches nested folders, so an `index.ts` in a subfolder becomes importable.
- Steiger checks each source root separately and cannot see package imports. Block the cross-package violation it misses with ESLint in the apps' config:

  ```js
  {
    files: ['src/shared/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@scope/core/entities', '@scope/core/entities/*'],
          message: 'The shared layer cannot import entities.',
        }],
      }],
    },
  }
  ```

- Run Steiger for every app and for `packages/core/src`. Core's config turns off `fsd/insignificant-slice` for `./src/entities/**`: the apps that consume those entities are outside core's source root, so every promoted entity looks unused.
- Packages do not read environment variables. Each app validates its own env and passes values (such as a base URL) into package factories.
- Lint React code in packages with the same React, hooks, and accessibility rules as the apps, minus Next.js-only rules and app-only FSD rules. Include `.tsx` in the package `tsconfig.json` and set `"jsx": "react-jsx"` before adding components; otherwise ESLint cannot parse them.
- Put a source-consumed workspace package (one whose TypeScript the apps compile) in each app's `transpilePackages`. A prebuilt UI package that publishes JavaScript, CSS, and declarations is not transpiled again.
- Keep package, lint, and Tailwind configuration out of the application runtime bundle. Each app keeps its own `public/`, environment files, and deployment configuration.

## Adding a feature (example: edit profile)

1. If there is no screen yet, create `src/_pages/<slice>` and `app/<route>/page.tsx`.
2. Put domain data the screen reads in `src/entities/<slice>`: types, URL, query key, read hook.
3. Put the user action in `src/features/<slice>`: schema (`model/`), mutation hook (`api/`), form (`ui/`).
4. Export from each slice's `index.ts`, and `index.server.ts` when needed.
5. Compose in `_pages` and keep the route file a re-export.
6. Run the project's FSD lint, type check, and related tests.

## Migrating from the `views` layout (v1)

Projects that used `src/app` as both the Next.js router and the FSD app layer, with `views` instead of `pages`, move as follows. Until a project migrates, pin the previous guide with `claude/skills/nextjs-fsd-architecture: "v1"` and `codex/skills/nextjs-fsd-architecture: "v1"` in `.harness/sync.yml`.

| v1                                             | v2                                                                   |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| `src/app/**` routes, layouts, route handlers   | root `app/**` (keep files thin)                                      |
| `src/app` providers, global styles, app config | `src/_app/{providers,styles,config}`                                 |
| `src/views/<slice>`                            | `src/_pages/<slice>`                                                 |
| `scripts/check-fsd-dependencies.mjs`           | removed: Steiger understands `_pages` (plus the ESLint rule above in a Turborepo) |
| `@scope/core` root barrel                      | `@scope/core/shared/<segment>`, `@scope/core/entities/<slice>`       |

- Move folders with `git mv` so history follows, update the `@/` imports, and point `tsconfig.json` `paths`, Tailwind `@source`, and test globs at the new folders.
- Replace the Steiger config with the one above, remove the `views`-specific exceptions, and drop `nextjs/fsd/dependency-check` from `.harness/sync.yml`.
- Run the FSD lint, type check, build, and tests after each app, not once at the end.
