# Team AI Harness Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 프로젝트 팀이 웹에서 AI Harness 동기화 구성을 선택하고 대상 레포에 검토 가능한 `.harness/sync.yml` 설정 PR을 생성하는 Next.js 대시보드를 만든다.

**Architecture:** 하네스 원본과 분리된 `themoment-ai-harness-dashboard` 단일 Next.js App Router 앱이다. GitHub OAuth 세션으로 사용자 권한을 확인하고, GitHub App 설치 토큰으로 하네스 매니페스트와 대상 레포 설정을 읽거나 설정 PR을 만든다. 구성 상태는 GitHub의 `.harness/sync.yml`만 원본으로 두며 별도 DB는 사용하지 않는다.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Auth.js GitHub provider, Octokit, Zod, YAML, Vitest.

## Global Constraints

- 앱 경로는 `themoment-ai-harness-dashboard/`이며, 하네스 원본 파일과 기존 동기화 워크플로를 수정하지 않는다.
- 새 구성은 `groups: []`와 `overrides: <item-id>: true`의 고정 allow-list를 기본으로 사용한다.
- 기존 그룹 기반 구성은 자동 수신 상태로 표시하되 명시적 전환 전에는 변경하지 않는다.
- 설정 변경은 직접 push하지 않고 `harness-config/<timestamp>` 브랜치의 PR로만 생성한다.
- GitHub App 설치 범위 안이고 OAuth 사용자의 레포 권한이 `maintain` 또는 `admin`인 경우에만 변경을 허용한다.
- OAuth access token은 세션·권한 확인에만, GitHub App 설치 토큰은 파일·브랜치·PR 변경에만 사용한다.
- 화면은 한국어로 제공하고 키보드 포커스·반응형 레이아웃·reduced-motion을 보장한다.
- 즉시 동기화 요청은 `2026-08-12-on-demand-sync-design.md`의 후속 범위이며 이번 앱 구현에서 제외한다.

---

### Task 1: Next.js 앱과 FSD 기반 구성

**Files:**
- Create: `themoment-ai-harness-dashboard/package.json`
- Create: `themoment-ai-harness-dashboard/tsconfig.json`
- Create: `themoment-ai-harness-dashboard/next.config.ts`
- Create: `themoment-ai-harness-dashboard/vitest.config.ts`
- Create: `themoment-ai-harness-dashboard/src/app/layout.tsx`
- Create: `themoment-ai-harness-dashboard/src/app/page.tsx`
- Create: `themoment-ai-harness-dashboard/src/app/globals.css`
- Create: `themoment-ai-harness-dashboard/src/views/dashboard/ui/dashboard-view.tsx`
- Create: `themoment-ai-harness-dashboard/src/shared/config/env.ts`
- Create: `themoment-ai-harness-dashboard/src/shared/config/env.test.ts`
- Create: `themoment-ai-harness-dashboard/.env.example`

**Interfaces:**
- Produces: `DashboardView` server component and `env` server-only configuration object.
- Consumes: no application code from prior tasks.

- [ ] **Step 1: Scaffold the TypeScript App Router application**

Run:

```bash
pnpm create next-app@latest themoment-ai-harness-dashboard --ts --tailwind --eslint --app --src-dir --import-alias '@/*' --use-pnpm --yes
```

Expected: `themoment-ai-harness-dashboard/src/app`과 `package.json`이 생성된다.

- [ ] **Step 2: Add runtime and test dependencies**

Run:

```bash
pnpm --dir themoment-ai-harness-dashboard add next-auth @octokit/auth-app @octokit/rest yaml zod
pnpm --dir themoment-ai-harness-dashboard add -D vitest @vitejs/plugin-react jsdom
```

Expected: GitHub 인증, YAML 처리, 환경 변수 검증, 단위 테스트 의존성이 설치된다.

- [ ] **Step 3: Write the failing environment validation test**

```ts
import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./env";

describe("parseServerEnv", () => {
  it("필수 GitHub 비밀값이 없으면 실패한다", () => {
    expect(() => parseServerEnv({})).toThrow("GITHUB_CLIENT_ID");
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `pnpm --dir themoment-ai-harness-dashboard vitest run src/shared/config/env.test.ts`

Expected: FAIL — `parseServerEnv` 모듈이 없다.

- [ ] **Step 5: Add minimal FSD shell and environment parser**

Create `src/shared/config/env.ts` with `server-only` and a Zod schema for `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `AUTH_SECRET`, `HARNESS_REPOSITORY`. Export `parseServerEnv(input)` and `env = parseServerEnv(process.env)`. Keep `src/app/page.tsx` limited to `return <DashboardView />`.

Use the UI direction "harness control desk": slate-blue workspace, warm paper-like content panels, restrained cyan status accents, compact mono labels for item IDs, and `Pretendard` fallback system typography. Do not use gradients or decorative charts.

- [ ] **Step 6: Run the test and lint**

Run:

```bash
pnpm --dir themoment-ai-harness-dashboard vitest run src/shared/config/env.test.ts
pnpm --dir themoment-ai-harness-dashboard lint
```

Expected: PASS and no lint errors.

### Task 2: 매니페스트와 sync 설정의 순수 해석기

**Files:**
- Create: `themoment-ai-harness-dashboard/src/entities/harness-config/model/types.ts`
- Create: `themoment-ai-harness-dashboard/src/entities/harness-config/lib/parse-manifest.ts`
- Create: `themoment-ai-harness-dashboard/src/entities/harness-config/lib/parse-sync-config.ts`
- Create: `themoment-ai-harness-dashboard/src/entities/harness-config/lib/build-sync-config.ts`
- Create: `themoment-ai-harness-dashboard/src/entities/harness-config/lib/build-sync-config.test.ts`
- Create: `themoment-ai-harness-dashboard/src/entities/harness-config/index.ts`

**Interfaces:**
- Produces: `HarnessItem`, `HarnessManifest`, `SyncConfig`, `parseManifest(yaml: string)`, `parseSyncConfig(yaml: string | null)`, `buildSyncConfig(input: SyncConfig): string`.
- Consumes: `yaml` and `zod` from Task 1.

- [ ] **Step 1: Write failing fixed-selection tests**

```ts
it("고정 선택은 그룹을 비우고 true override만 기록한다", () => {
  expect(buildSyncConfig({
    enabled: true,
    mode: "fixed",
    itemIds: ["claude/skills/api-design", "gemini/settings"],
  })).toBe(
    "enabled: true\ngroups: []\noverrides:\n  claude/skills/api-design: true\n  gemini/settings: true\n",
  );
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --dir themoment-ai-harness-dashboard vitest run src/entities/harness-config/lib/build-sync-config.test.ts`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement schemas and serialisation**

Implement only the manifest fields currently used by the UI: `id`, `src`, `dest`, `groups`. Reject duplicate IDs and malformed YAML. Parse absent target config as `{ enabled: true, mode: "automatic", groups: defaults, overrides: {} }`; preserve a present config's `base_branch`, `branch_prefix`, `language`, and `pr_label` when rebuilding it. Emit a stable YAML order: `enabled`, `groups`, preserved options, `overrides` sorted by ID.

- [ ] **Step 4: Add behavior tests**

Cover invalid YAML rejection, `enabled: false` retention, a group-based config retaining `groups`, and a fixed config not gaining an item newly added to the manifest.

- [ ] **Step 5: Run focused tests**

Run: `pnpm --dir themoment-ai-harness-dashboard vitest run src/entities/harness-config/lib`

Expected: PASS.

### Task 3: GitHub OAuth 세션과 GitHub App 서버 클라이언트

**Files:**
- Create: `themoment-ai-harness-dashboard/src/auth.ts`
- Create: `themoment-ai-harness-dashboard/src/app/api/auth/[...nextauth]/route.ts`
- Create: `themoment-ai-harness-dashboard/src/shared/api/github-app.ts`
- Create: `themoment-ai-harness-dashboard/src/shared/api/github-user.ts`
- Create: `themoment-ai-harness-dashboard/src/shared/api/github-app.test.ts`
- Modify: `themoment-ai-harness-dashboard/src/shared/config/env.ts`
- Modify: `themoment-ai-harness-dashboard/src/app/layout.tsx`

**Interfaces:**
- Produces: `auth`, `handlers`, `getUserRepositoryPermission(owner, repo)`, `getInstallationToken(installationId)`, and server-only Octokit factories.
- Consumes: `env` from Task 1 and config types from Task 2.

- [ ] **Step 1: Write failing GitHub App token test**

```ts
it("설치 ID로 토큰을 요청한다", async () => {
  const createAppAuth = vi.fn().mockResolvedValue({ token: "installation-token" });
  await expect(getInstallationToken(42, createAppAuth)).resolves.toBe("installation-token");
  expect(createAppAuth).toHaveBeenCalledWith({ type: "installation", installationId: 42 });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --dir themoment-ai-harness-dashboard vitest run src/shared/api/github-app.test.ts`

Expected: FAIL — `getInstallationToken` does not exist.

- [ ] **Step 3: Configure GitHub OAuth and installation auth**

Use Auth.js GitHub provider with `scope: "read:user repo"`. Persist the OAuth access token only in the encrypted JWT session and do not expose it through the client `session` object. Use `@octokit/auth-app` for GitHub App JWT and installation-token creation. Mark all GitHub clients with `server-only`.

- [ ] **Step 4: Implement permission and installation lookups**

Use the OAuth token to list the user's accessible App installations and repositories, and query `GET /repos/{owner}/{repo}/collaborators/{username}/permission` to require `maintain` or `admin`. Return a typed `DashboardRepository` only when both checks pass.

- [ ] **Step 5: Run focused tests and TypeScript validation**

Run:

```bash
pnpm --dir themoment-ai-harness-dashboard vitest run src/shared/api/github-app.test.ts
pnpm --dir themoment-ai-harness-dashboard exec tsc --noEmit
```

Expected: PASS.

### Task 4: 읽기 전용 대시보드 데이터 API

**Files:**
- Create: `themoment-ai-harness-dashboard/src/entities/repository/model/types.ts`
- Create: `themoment-ai-harness-dashboard/src/entities/repository/api/get-dashboard-data.server.ts`
- Create: `themoment-ai-harness-dashboard/src/entities/repository/api/get-dashboard-data.server.test.ts`
- Create: `themoment-ai-harness-dashboard/src/entities/repository/index.server.ts`
- Create: `themoment-ai-harness-dashboard/src/app/api/repositories/route.ts`
- Create: `themoment-ai-harness-dashboard/src/app/api/repositories/[owner]/[repo]/route.ts`

**Interfaces:**
- Produces: `getDashboardRepositories(userToken)`, `getRepositoryDashboardData({ owner, repo, userToken })` and JSON routes.
- Consumes: manifest/config parser from Task 2 and GitHub clients from Task 3.

- [ ] **Step 1: Write failing repository gate test**

```ts
it("권한이 없으면 대상 설정을 읽지 않는다", async () => {
  await expect(getRepositoryDashboardData({ owner: "acme", repo: "api", userToken: "user-token" }))
    .rejects.toMatchObject({ code: "FORBIDDEN" });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --dir themoment-ai-harness-dashboard vitest run src/entities/repository/api/get-dashboard-data.server.test.ts`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement data retrieval**

Read `sync-manifest.yml` from `HARNESS_REPOSITORY` `main` with a GitHub App token. Read `.harness/sync.yml` from the selected target repository's configured default branch with that repository's installation token. Return parsed manifest, parsed config, selected item IDs, and automatic/fixed mode. Treat a missing settings file as legacy automatic configuration; do not write it.

- [ ] **Step 4: Implement API route error mapping**

Map missing OAuth session to 401, permission or installation failures to 403, absent repository to 404, invalid YAML to 422, and GitHub failures to a safe 502 message without tokens or upstream response bodies.

- [ ] **Step 5: Run focused tests**

Run: `pnpm --dir themoment-ai-harness-dashboard vitest run src/entities/repository/api/get-dashboard-data.server.test.ts`

Expected: PASS.

### Task 5: 설정 PR 생성 서버 기능

**Files:**
- Create: `themoment-ai-harness-dashboard/src/features/create-config-pr/model/schema.ts`
- Create: `themoment-ai-harness-dashboard/src/features/create-config-pr/api/create-config-pr.server.ts`
- Create: `themoment-ai-harness-dashboard/src/features/create-config-pr/api/create-config-pr.server.test.ts`
- Create: `themoment-ai-harness-dashboard/src/features/create-config-pr/index.server.ts`
- Create: `themoment-ai-harness-dashboard/src/app/api/repositories/[owner]/[repo]/config-pr/route.ts`

**Interfaces:**
- Produces: `createConfigPullRequest(input: CreateConfigPullRequestInput): Promise<{ url: string; number: number }>`.
- Consumes: `buildSyncConfig` from Task 2 and authorization/data reader from Task 4.

- [ ] **Step 1: Write failing duplicate PR test**

```ts
it("열린 harness-config PR이 있으면 새 브랜치를 만들지 않는다", async () => {
  await expect(createConfigPullRequest(validInput)).resolves.toEqual({
    url: "https://github.com/acme/api/pull/12",
    number: 12,
  });
  expect(createReference).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --dir themoment-ai-harness-dashboard vitest run src/features/create-config-pr/api/create-config-pr.server.test.ts`

Expected: FAIL — module not found.

- [ ] **Step 3: Validate and authorize every mutation**

Accept only `enabled`, `mode`, selected manifest item IDs, and supported preserved sync options. Re-read the manifest and repository config; reject unknown item IDs or malformed YAML. Re-check OAuth `maintain`/`admin` permission and matching App installation immediately before any GitHub write.

- [ ] **Step 4: Create branch, commit, and PR**

If no open PR with a head beginning `harness-config/` exists, obtain the configured `base_branch` SHA, create `harness-config/<UTC timestamp>`, create or update `.harness/sync.yml`, and open a PR against `base_branch`. Use title `chore: AI Harness 동기화 설정 변경`; include selected/removed item ID lists and the YAML diff in the body. Return the created PR URL and number.

- [ ] **Step 5: Run focused tests and build**

Run:

```bash
pnpm --dir themoment-ai-harness-dashboard vitest run src/features/create-config-pr/api/create-config-pr.server.test.ts
pnpm --dir themoment-ai-harness-dashboard build
```

Expected: PASS and successful production build.

### Task 6: 대시보드 UI와 설정 diff 경험

**Files:**
- Create: `themoment-ai-harness-dashboard/src/features/select-harness-items/model/selection.ts`
- Create: `themoment-ai-harness-dashboard/src/features/select-harness-items/model/selection.test.ts`
- Create: `themoment-ai-harness-dashboard/src/features/select-harness-items/ui/item-selector.tsx`
- Create: `themoment-ai-harness-dashboard/src/features/toggle-sync/ui/sync-toggle.tsx`
- Create: `themoment-ai-harness-dashboard/src/features/create-config-pr/ui/create-config-pr-button.tsx`
- Create: `themoment-ai-harness-dashboard/src/widgets/repository-sidebar/ui/repository-sidebar.tsx`
- Create: `themoment-ai-harness-dashboard/src/widgets/config-preview/ui/config-preview.tsx`
- Modify: `themoment-ai-harness-dashboard/src/views/dashboard/ui/dashboard-view.tsx`
- Modify: `themoment-ai-harness-dashboard/src/app/globals.css`

**Interfaces:**
- Produces: client-side selected configuration state and accessible UI that calls Task 4/Task 5 API routes.
- Consumes: `HarnessItem`, `SyncConfig`, and PR response types from prior tasks.

- [ ] **Step 1: Write failing selection reducer test**

```ts
it("고정 모드에서 선택 해제한 항목은 override 목록에서 제거한다", () => {
  expect(toggleItem(initialState, "claude/skills/api-design").itemIds).toEqual([]);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --dir themoment-ai-harness-dashboard vitest run src/features/select-harness-items/model/selection.test.ts`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the control-desk layout**

Build a responsive three-region layout: repository list on the left, grouped selection controls in the centre, and generated YAML/diff plus PR action on the right. Show an explicit automatic-mode notice for legacy group configurations and a "고정 선택으로 전환" action. Keep the activity focus on the configuration itself: no dashboard charts, no placeholder metrics.

- [ ] **Step 4: Implement disabled, error, and empty states**

Provide sign-in, no-manageable-repository, permission failure, malformed YAML, PR-in-progress, and `enabled: false` states. The sync toggle must change only `enabled`, not selected item state. The PR button must have an in-progress state and redirect/open the returned PR URL only after success.

- [ ] **Step 5: Complete accessibility and visual checks**

Ensure all selection inputs use native checkbox or switch semantics, visible focus rings, concise Korean labels, and `prefers-reduced-motion` transitions. Verify desktop and 375px mobile widths with a browser screenshot.

- [ ] **Step 6: Run all checks**

Run:

```bash
pnpm --dir themoment-ai-harness-dashboard vitest run
pnpm --dir themoment-ai-harness-dashboard lint
pnpm --dir themoment-ai-harness-dashboard exec tsc --noEmit
pnpm --dir themoment-ai-harness-dashboard build
```

Expected: all commands pass.

## Plan Self-Review

- Spec coverage: Tasks 1–6 cover separate app setup, Korean dashboard UI, OAuth/App authorization, manifest/config reading, fixed and legacy configuration modes, enabled toggle, YAML diff, configuration PRs, and required errors/tests. The excluded on-demand sync feature remains in its own specification.
- Scope: no database-backed configuration, sync execution controls, PR merge operations, organization administration, analytics, or unrelated harness refactoring is included.
- Consistency: all GitHub writes pass through Task 5 after Task 3/4 permission and installation checks; all selected configuration is serialized by Task 2; UI is a consumer of those APIs in Task 6.
- Placeholder scan: no `TODO`, `TBD`, or deferred implementation steps remain.
