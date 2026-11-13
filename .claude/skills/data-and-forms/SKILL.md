---
name: data-and-forms
description: Use when reading or changing server data with TanStack Query, or building forms with Zod and React Hook Form, in a Next.js FSD project — query key factories, hook names, RSC prefetch with HydrationBoundary, invalidation scope, schema naming, mutation submit, and mapping API errors to form errors.
---

# Data and Forms Guide

Paths such as `src/`, `app/`, and `@/` are relative to a web app: the project root for a single app, or each `apps/<name>/` folder in a Turborepo. The examples use `user`, `edit-profile`, and `/users/:id` as illustrations; they are not existing code. Where the project already has different names for its HTTP wrappers, error class, or query client helper, use the project's names.

## Where things go

| What                                   | Where                                             |
| -------------------------------------- | ------------------------------------------------- |
| response types                         | owning entity `model/`                            |
| URL constants, query key factory       | owning entity `api/`                              |
| read hooks (`useGet...`)               | owning entity `api/`                              |
| server-only read functions             | owning entity `api/`, exported from `index.server.ts` |
| mutation hook for a user action        | the feature that owns the action, `api/`          |
| form schema and request type           | feature `model/`                                  |
| form component                         | feature `ui/`                                     |
| prefetch and `HydrationBoundary`       | the page component in `src/_pages/<slice>/ui/`    |

If there is no entity yet and only one feature uses the data, keep it in that feature. Move it to an entity when a second consumer appears.

## HTTP calls

- Call the project's typed method wrappers (`get`, `post`, `patch`, `put`, `del`) that return the response body. Do not call the raw Axios instance for ordinary requests; it returns `AxiosResponse`.
- Pass the response type first and the body type second: `post<UserResponseType, UpdateProfileReqType>(url, body)`.
- Browser code uses the client module (for example `@/shared/api`); server code uses the server-only module (for example `@/shared/api/index.server`).
- Follow the backend's real paths in URL constants. Do not add `/api` or version prefixes without evidence.

## Query key factory

One factory per resource. Every key is a hierarchical array that starts from `all()`.

```ts
// src/entities/user/api/userQueryKeys.ts
export const userQueryKeys = {
  all: () => ['users'] as const,
  lists: () => [...userQueryKeys.all(), 'list'] as const,
  list: (params: { page: number }) => [...userQueryKeys.lists(), params] as const,
  details: () => [...userQueryKeys.all(), 'detail'] as const,
  detail: (id: string) => [...userQueryKeys.details(), id] as const,
};
```

- Never write a key as a literal array at the call site; always go through the factory.
- Put filters and pagination in the last element as an object.

## Hook names

| Action         | Name                  | TanStack hook |
| -------------- | --------------------- | ------------- |
| read           | `useGet<Resource>`    | `useQuery`    |
| create         | `usePost<Resource>`   | `useMutation` |
| partial update | `usePatch<Resource>`  | `useMutation` |
| full update    | `usePut<Resource>`    | `useMutation` |
| delete         | `useDelete<Resource>` | `useMutation` |

Match the name to the HTTP method (a `patch` request is `usePatch...`).

```ts
// src/entities/user/api/useGetUser.ts
import { useQuery } from '@tanstack/react-query';

import { get } from '@/shared/api';

import type { UserResponseType } from '../model/types';
import { userQueryKeys } from './userQueryKeys';
import { USER_URL } from './userUrl';

export const useGetUser = (id: string) =>
  useQuery({
    queryKey: userQueryKeys.detail(id),
    queryFn: () => get<UserResponseType>(USER_URL.detail(id)),
  });
```

## RSC prefetch and HydrationBoundary

Fetch first-screen data on the server and put it in the client cache.

1. Export a server-only read function from the entity's `index.server.ts`. The server cannot use the browser's proxied path, so it uses the server-only HTTP module.

   ```ts
   // src/entities/user/api/getUserOnServer.ts
   import { get } from '@/shared/api/index.server';

   import type { UserResponseType } from '../model/types';
   import { USER_URL } from './userUrl';

   export const getUserOnServer = (id: string) => get<UserResponseType>(USER_URL.detail(id));
   ```

2. In the async Server Component in `src/_pages/<slice>/ui/`, create a QueryClient with the project's `getQueryClient()`, prefetch with **the same key as the client hook**, and wrap the client UI in `HydrationBoundary`. The route file only re-exports the page.

   ```tsx
   // src/_pages/user/ui/UserPage.tsx
   import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

   import { UserDetails, userQueryKeys } from '@/entities/user';
   import { getUserOnServer } from '@/entities/user/index.server';
   import { getQueryClient } from '@/shared/api';

   const UserPage = async ({ params }: PageProps<'/users/[id]'>) => {
     const { id } = await params;
     const queryClient = getQueryClient();

     await queryClient.prefetchQuery({
       queryKey: userQueryKeys.detail(id),
       queryFn: () => getUserOnServer(id),
     });

     return (
       <HydrationBoundary state={dehydrate(queryClient)}>
         <UserDetails userId={id} />
       </HydrationBoundary>
     );
   };

   export default UserPage;

   // app/users/[id]/page.tsx
   export { UserPage as default } from '@/_pages/user';
   ```

3. Client components keep using `useGetUser(id)`. While the cached data is within `staleTime`, it is not requested again.

- `await` the prefetch unless the project's QueryClient is configured to dehydrate pending queries.
- `getQueryClient()` returns a new instance per call on the server. Call it once per page component and use that instance for both prefetch and dehydrate. On the browser it returns a singleton.
- `prefetchQuery` does not throw. On failure the client hook requests again and exposes the error through `error`.
- `getQueryClient` is shared by server and client code, so the client API module must not import `server-only` code or server environment variables.

## Mutations and invalidation scope

A successful mutation invalidates **the narrowest key that changed**.

```ts
// src/features/edit-profile/api/usePatchProfile.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { USER_URL, userQueryKeys, type UserResponseType } from '@/entities/user';
import { patch } from '@/shared/api';

import type { EditProfileReqType } from '../model/editProfileSchema';

export const usePatchProfile = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: EditProfileReqType) =>
      patch<UserResponseType, EditProfileReqType>(USER_URL.detail(userId), body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userQueryKeys.detail(userId) }),
  });
};
```

| Change                        | Invalidate                                              |
| ----------------------------- | ------------------------------------------------------- |
| one field of one item         | `detail(id)`, plus `lists()` if lists show that field   |
| create or delete              | `lists()`                                               |
| affects the whole resource    | `all()`                                                 |

- Return the `invalidateQueries` promise from `onSuccess` so the mutation stays pending until the refetch finishes.
- When the response already contains the new data for a single key, `setQueryData` is fine.
- Do not call `queryClient.invalidateQueries()` without a key unless you can justify it.

## Forms

The Zod schema defines both validation and types.

```ts
// src/features/edit-profile/model/editProfileSchema.ts
import { z } from 'zod';

export const EditProfileSchema = z.object({
  nickname: z.string().trim().min(2, '닉네임은 2자 이상이어야 합니다.').max(20),
});

export type EditProfileReqType = z.infer<typeof EditProfileSchema>;
```

- Name schemas `<Action/Resource>Schema` and inferred request types `<Action/Resource>ReqType`. Do not rewrite a type the schema already defines.
- Write error messages in the schema, in the language users see.
- Prefer literal unions and `Record<Union, Metadata>` constants over `enum`.

Connect the schema with `zodResolver` and submit through the mutation.

```tsx
// src/features/edit-profile/ui/EditProfileForm.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { ApiError } from '@/shared/api';

import { usePatchProfile } from '../api/usePatchProfile';
import { type EditProfileReqType, EditProfileSchema } from '../model/editProfileSchema';

interface EditProfileFormProps {
  userId: string;
  defaultValues: EditProfileReqType;
}

// Map server error codes to fields. Unknown codes become a form-level error.
const FIELD_BY_ERROR_CODE: Partial<Record<string, keyof EditProfileReqType>> = {
  NICKNAME_TAKEN: 'nickname',
};

const EditProfileForm = ({ userId, defaultValues }: EditProfileFormProps) => {
  const { mutateAsync, isPending } = usePatchProfile(userId);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(EditProfileSchema),
    defaultValues,
  });

  const onSubmit = async (values: EditProfileReqType) => {
    try {
      await mutateAsync(values);
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }
      const field = FIELD_BY_ERROR_CODE[error.code];
      setError(field ?? 'root.server', { message: error.message });
    }
  };

  return (
    <form onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
      <label htmlFor="nickname">닉네임</label>
      <input id="nickname" {...register('nickname')} aria-invalid={Boolean(errors.nickname)} />
      {errors.nickname && <p role="alert">{errors.nickname.message}</p>}
      {errors.root?.server && <p role="alert">{errors.root.server.message}</p>}
      <button type="submit" disabled={isPending}>
        저장
      </button>
    </form>
  );
};

export default EditProfileForm;
```

- Do not pass generics to `useForm`; `zodResolver(Schema)` infers input and output types.
- `handleSubmit(onSubmit)` returns a promise, which trips ESLint `no-misused-promises`. Wrap it with `void` as above.
- Rethrow errors that are not the project's API error class; never swallow them.
- If the API error carries only a code, keep a `code → field` map next to the form. If the API returns per-field errors, agree with the user before widening the error class.
- Leave 401 handling to the HTTP interceptor; forms do not redirect to login themselves.
- Accessibility: connect a `label` to every input and announce errors with `aria-invalid` and `role="alert"`.

## Tests

- Query key factories and schemas are pure; unit-test boundary values (empty string, max length).
- Test form components with Testing Library by typing and submitting, and replace the mutation with a module mock. Do not depend on the network.
