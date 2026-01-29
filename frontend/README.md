# Frontend (React + Vite + Tailwind)

This document defines minimal, safe improvements to structure, conventions, and workflows for the existing codebase without breaking current behavior.

## Goals
- Improve readability and consistency
- Enforce clear separation of concerns
- Make onboarding easy for teammates
- Reduce duplication and mixed responsibilities
- Avoid breaking changes or big rewrites

## Current Structure
```
src/
  assets/
  components/
    ui/
  hooks/
  lib/
    axios.js
    utils.js
  pages/
  store/
  App.jsx
  main.jsx
  index.css
```

## Folder Responsibilities
- pages: Route-level containers. Compose components and orchestrate data via hooks/services. Minimal UI logic only.
- components: Reusable, presentational UI. No API calls. No route logic. Keep them stateless where possible.
- components/ui: Low-level, reusable primitives (Button, Input, Dialog, Table, etc.). No business logic.
- hooks: Custom hooks for view logic and state that multiple pages/components share. May call services, not axios directly.
- store: Global state (e.g., auth) with Zustand. Keep side-effects minimal and route-agnostic.
- lib: Cross-cutting utilities and configuration. Keep `axios.js` here. Avoid putting feature logic here.
- services (new): Centralize API calls per feature/domain. Consume `lib/axios`. No React imports.
- assets: Static assets.

## Incremental Structure Improvements (Safe)
- Keep lib/axios.js as-is. Add src/services/* to move API calls out of components over time.
- Keep pages/components names. Extract large chunks gradually into hooks/components.
- Split lib into: keep axios here; move general helpers into `src/utils` later as needed.

## Coding Rules
- API calls: Only from `services/*` or inside custom hooks. Never inside components/pages directly.
- Error/loading: Standardize shape `{ data, isLoading, error, refetch }` in hooks.
- Component size: Prefer <200 lines for components; extract sections into subcomponents.
- File names: PascalCase for components/pages; camelCase for hooks/services; `useX` prefix for hooks.
- Imports: Use relative paths within `src` until path aliases are introduced (future).
- Tailwind: Prefer composition via UI primitives; avoid 20+ class strings inline.

## API & Data Handling Pattern
- axios instance: `lib/axios.js` (already in place)
- Domain services: `services/<domain>.service.js` (pure functions)
- Hooks: `hooks/use<Domain>.js` to orchestrate loading/error and cache minimal state
- Pages: consume hooks; components remain presentational

Example service:
```js
// src/services/university.service.js
import axios from '../lib/axios';

export const getUniversities = () => axios.get('/universities');
export const createUniversity = (name) => axios.post('/universities', { name });
```

Example hook consuming the service:
```js
// src/hooks/useUniversities.js (shape only)
import { useEffect, useState } from 'react';
import { getUniversities, createUniversity as createUniversityApi } from '../services/university.service';

export function useUniversities() {
  const [universities, setUniversities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUniversities = async () => {
    try { setIsLoading(true); const { data } = await getUniversities(); setUniversities(data); setError(null); }
    catch (e) { setError('Failed to fetch universities'); }
    finally { setIsLoading(false); }
  };

  const createUniversity = async (name) => {
    const { data } = await createUniversityApi(name);
    setUniversities(prev => [...prev, data].sort((a,b) => a.name.localeCompare(b.name)));
    return data;
  };

  useEffect(() => { fetchUniversities(); }, []);
  return { universities, isLoading, error, refetch: fetchUniversities, createUniversity };
}
```

## Refactoring Strategy (80/20)
Must fix now (high impact, low risk):
- Centralize API calls used in hooks into `services/*` (universities, majors, research fields, dashboard). Keep the same responses.
- Replace mock UI inside `LoginForm` with components from `components/ui` to reduce duplicated styles.
- Extract repeated loading/error patterns into each hook with the same return shape.

Improve later (incremental):
- Split very large pages (e.g., AdminHome.jsx) into: `Page` + child components (`StatCard`, `TrendsChart`, `ActivitiesList`) and a `useAdminDashboard()` hook.
- Consolidate role-based route paths in a `constants/routes.js` to avoid string repetition.
- Introduce a small `cn()` class merge helper in `lib/utils.js` for Tailwind class composition.

## React Best Practices (Applied)
- Smart vs Presentational: pages/hooks manage data; components render. Avoid axios in components.
- Custom hooks when: multiple pages share logic; component exceeds ~200 lines; multiple effects manage data flow.
- Props shape: Components accept data already formatted (dates, labels) when possible.
- Side-effects: Keep in hooks or store; components should be pure.

## Tailwind Guidelines
- Prefer UI primitives (`components/ui/*`) with size/variant props over long inline class strings.
- Extract repeated patterns (cards, list items, form rows) into small components.
- Keep animations and keyframes in CSS or component-level style blocks used across the app, not copied inline.

## Before/After Examples
Inline API in component → service-based API:

Before (component):
```js
const res = await axiosInstance.get('/dashboard/stats?timeRange=' + selectedTimeRange);
setDashboardData(res.data);
```

After (service + hook):
```js
// services/dashboard.service.js
export const getDashboardStats = (timeRange) => axios.get(`/dashboard/stats?timeRange=${timeRange}`);

// hooks/useAdminDashboard.js
const { data } = await getDashboardStats(selectedTimeRange);
setDashboardData(data);
```

Mixed UI + logic → separated concerns:

Before (page renders + manages charts + fetches): large `AdminHome.jsx` doing everything.

After (split):
- `pages/admin/AdminHome.jsx` (routing + layout)
- `hooks/useAdminDashboard.js` (fetching/transforming)
- `components/dashboard/StatCard.jsx`, `components/dashboard/TrendsChart.jsx`, `components/dashboard/ActivitiesList.jsx`

LoginForm mock components → shared UI primitives:

Before:
```jsx
const Button = (props) => <button className="...">{props.children}</button>;
const Input = (props) => <input className="..." />;
```

After:
```jsx
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
```

## How to Add a New Page/Feature
1. Define route and page file in `src/pages/<feature>/<Page>.jsx`.
2. Create a service in `src/services/<feature>.service.js` for all API calls.
3. If needed, create `src/hooks/use<Feature>.js` to manage loading/error and data transformations.
4. Build presentational components in `src/components/<feature>/` (no API calls inside).
5. Wire the route in `App.jsx` and render the page.
6. Keep files small; extract subcomponents or hooks as needed.

## Checklists
- No axios/fetch inside components.
- Hooks return `{ data, isLoading, error, refetch }` (or named equivalents).
- Components under `components/ui` have variants and sizes to avoid long Tailwind strings.
- Pages import hooks/services; components receive already-prepared props.

## Notes
- Backend contracts are stable; this guidance does not change API behavior—only where calls live.
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
