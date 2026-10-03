# State & Data Flow

> Part of the `webpage-design` knowledge base. Research compiled October 2026.
> The core discipline: **every piece of state has exactly one owner.**

---

## 1. The decision procedure

Ask, in order, and stop at the first match:

```
1. Is the truth on the server, and does the user just need to READ it?
   -> Server Component. No client state, no cache, no effect.

2. Does it need to survive a reload, travel in a link, and obey Back/Forward?
   -> The URL. Filters, sort, pagination, open tab, search query.

3. Does the user keep working with it AFTER load (polling, infinite feed, optimistic edits)?
   -> Query cache (TanStack Query v5), seeded from a Server Component.

4. Does only one component or subtree care?
   -> useState / useReducer, as low in the tree as it can live.

5. Is it genuinely cross-cutting and changes often?
   -> A small store (Zustand) with selector-based subscriptions.

6. Cross-cutting but rarely changes?
   -> Context. Split state from dispatch if they change at different rates.
```

**The question that catches people:** a search filter is typed by the user, so it *feels* like client
state - but the second question catches it: it has to survive a reload, so it goes in the URL, not a
store.

---

## 2. The four classic mistakes

### 1. Server cache in Redux/Zustand

You end up reimplementing deduplication, cache invalidation, refetching, and pagination - badly.

```ts
// Wrong - you now own cache invalidation forever
const posts = useStore(s => s.posts);
useEffect(() => { dispatch(fetchPosts()); }, []);
```

```ts
// Right - the server renders it, zero JS shipped
export default async function Page() {
  const posts = await db.posts.findMany();
  return <PostList posts={posts} />;
}
```

### 2. URL state in a store

Breaks back/forward and shareable links. Users expect a filtered view to be linkable.

### 3. Context for high-frequency updates

Every consumer re-renders when the provider value changes. Mouse position in Context re-renders the
whole tree on every move. Use a store with selectors.

### 4. A global form store

Forms are component-local. A global "form store" is almost always the wrong abstraction. Use
`useActionState`, React Hook Form, or TanStack Form.

---

## 3. URL as state

The URL is the only state that both the server and the client can read, and the only one that
survives reload, travels in a link, and obeys browser history.

```tsx
// Next.js App Router - basic
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

function useFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value); else params.delete(key);
    router.replace(`${pathname}?${params}`);   // replace, not push, for filters
  };
  return { params: searchParams, setFilter };
}
```

**Use `replace` not `push`** for filters that change on every keystroke - otherwise Back becomes
useless.

### nuqs for type safety

```tsx
import { useQueryState, parseAsInteger, parseAsString } from 'nuqs';

export function ProductFilters() {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [q, setQ] = useQueryState('q', parseAsString.withDefault(''));

  // URL becomes ?page=2&q=shoes - back/forward, refresh, share all work
  return (
    <>
      <input value={q} onChange={e => setQ(e.target.value || null)} />
      <button onClick={() => setPage(p => p + 1)}>Next</button>
    </>
  );
}
```

---

## 4. Server Components and Actions

### The mental model

Server Components run in a separate environment from your client app, before bundling. They can read
databases, the filesystem, and secrets, and ship **zero JavaScript**.

```tsx
// Server Component - can touch the DB directly, ships no JS
export default async function ProductPage({ id }: { id: string }) {
  const product = await db.products.findUnique({ where: { id } });
  const related = await db.products.findMany({ where: { category: product.category } });
  return (
    <>
      <ProductDetail product={product} />
      <RelatedProducts products={related} />
    </>
  );
}
```

### Rules

- Server Components **cannot** use hooks like `useState` or event handlers.
- Anything with `"use client"` becomes part of the client bundle - **keep client boundaries as low
  and as narrow as possible.**
- Props crossing the boundary must be **serializable.**
- The server reads URL state as `searchParams`; the client reads the same state via hooks.

### Avoiding waterfalls

This is the single most common performance mistake in RSC apps:

```tsx
// BAD - sequential awaits, three round trips
const user = await getUser(id);
const posts = await getPosts(user.id);
const comments = await getComments(user.id);
```

```tsx
// GOOD - parallel, one round trip
const user = await getUser(id);
const [posts, comments] = await Promise.all([
  getPosts(user.id),
  getComments(user.id),
]);
```

**Rule: fetch in parallel, not in a waterfall.** When one call genuinely depends on another's result,
start the independent calls before awaiting.

### Suspense as a loading strategy

Wrap slow, independent parts in `<Suspense>` with a skeleton sized to the real content. Streaming SSR
then sends the fast shell immediately.

```tsx
export default function Page() {
  return (
    <>
      <Header />                      {/* instant */}
      <Suspense fallback={<ListSkeleton />}>
        <SlowList />                  {/* streams in */}
      </Suspense>
    </>
  );
}
```

**Size your skeletons to match the real content** or you have traded CLS for a layout jump.

---

## 5. Query cache - when you actually need it

TanStack Query's own guidance: in a new Server Components app, start with your framework's data
fetching and bring in a query library only when needed, which "might be never."

You need it for data the user **keeps working with after load**:

- Lists that poll
- Infinite feeds
- Optimistic mutations
- Refetch on window focus
- Client-side pagination over large sets

### The SSR handshake

```tsx
// 1. Server Component: prefetch and dehydrate
import { dehydrate, QueryClient } from '@tanstack/react-query';

export default async function Page() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(postOptions(id));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostList />          {/* Client Component reads the same cache */}
    </HydrationBoundary>
  );
}
```

**Critical:** the Server Component prefetches, but the **Client Component renders**. If the page
itself renders the same data, it drifts out of sync the moment the client refetches.

Share a single `queryOptions` object between both sides so they cannot diverge.

```ts
// shared between server and client
---

## 6. Forms

### Server Actions with useActionState

```tsx
'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();   // no prop drilling needed
  return <button type="submit" disabled={pending}>{pending ? 'Saving...' : 'Save'}</button>;
}

export function Form() {
  const [state, formAction, isPending] = useActionState(createPost, { error: null });

  return (
    <form action={formAction}>
      <input name="title" required />
      {state.error && <p role="alert">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
```

### Optimistic updates

```tsx
const [optimisticItems, addOptimistic] = useOptimistic(
  items,
  (state, newItem) => [...state, newItem],
);
```

`useOptimistic` renders the optimistic value during the flight and **reverts automatically on
error** - which is the part people get wrong when hand-rolling this.

### Validation

- **Progressive enhancement:** use native constraint validation (`required`, `pattern`, `type`) so
  validation works without JavaScript.
- Server Actions validate again - **never trust client validation.**
- Validate on blur and submit, not per keystroke.
- Return structured errors and map them to fields.

---

## 7. Choosing a store

| Situation | Choice |
|---|---|
| Local UI state | `useState` / `useReducer` |
| Non-trivial transitions (4+ interdependent actions) | `useReducer` |
| Cross-cutting, changes often | **Zustand** with selectors |
| Many tiny derived atoms (graph-shaped state) | Jotai |
| Rarely-changing cross-cutting | Context |
| Legacy codebase with existing middleware needs | Redux Toolkit (RTK Query) |

### Selector-based subscriptions are not optional

```ts
import { create } from 'zustand';

export const useCart = create<CartState>()((set, get) => ({
  items: [],
  add: (item) => set(s => ({ items: [...s.items, item] })),
  remove: (id) => set(s => ({ items: s.items.filter(i => i.id !== id) })),
}));

// Subscribe to ONLY the slice you need - no unrelated re-renders
function CartBadge() {
  const count = useCart(s => s.items.length);
  return <span>{count}</span>;
}
```

### Context: split state from dispatch

```tsx
// Bad - one context holding both means every consumer re-renders on either change
const AppCtx = createContext<{ user; setUser; theme; setTheme }>(...);

// Better - two contexts, separate update rates
const UserStateCtx = createContext<User | null>(null);
const UserDispatchCtx = createContext<Dispatch<SetStateAction<User | null>>>(...);
```

When both change at different rates, split them. When they both change constantly, use a store.

---

## Sources

- React Server Components: https://react.dev/reference/rsc/server-components
- useActionState: https://react.dev/reference/react/useActionState
- useFormStatus: https://react.dev/reference/react-dom/hooks/useFormStatus
- useOptimistic: https://react.dev/reference/react/useOptimistic
- Next.js App Router: https://nextjs.org/docs/app
- TanStack Query advanced SSR: https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
- nuqs: https://nuqs.dev/
- Zustand: https://zustand.docs.pmnd.rs/