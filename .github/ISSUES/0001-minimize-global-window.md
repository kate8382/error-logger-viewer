Title: RFC: Restrict `global.d.ts` to a minimal public `Window` surface and reference concrete module types

Summary
-------
The repository currently exposes many concrete types and module-level symbols from a broad `global.d.ts`. This tight coupling and surface area makes the codebase harder to maintain and increases risk of accidental type leakage, circular imports, and stale declarations.

Proposal
--------
1. Keep `global.d.ts` limited to the minimal, public-facing `Window` members the runtime truly expects (for example: `app`, `errorTableInstance`, `statsManager`, `chartManager`, `aside`), with permissive optional types.
2. Move or reference concrete types (e.g. `ErrorTable`, `StatsManager`, `ChartManager`, `ErrorApi`, `Aside`, `AppInterface`) in their respective modules and export them as needed.
3. Replace a monolithic ambient `.d.ts` with a small module-scoped augmentation that imports module types using `import type` and augments `declare global { interface Window { ... } }`. This keeps type references accurate and avoids ambient namespace pollution.

Rationale / Benefits
--------------------
- Reduces global surface area and accidental type coupling between modules.
- Makes it clearer which globals are intentionally public runtime hooks vs. internal implementation details.
- Avoids long-term maintenance friction as module types evolve.
- Eliminates potential circular-type problems by importing types only where necessary.

Suggested migration steps
-------------------------
1. Audit current `global.d.ts` and list all fields it declares on `Window`.
2. Decide the minimal public fields the app actually needs globally (suggested list: `app`, `errorTableInstance`, `statsManager`, `chartManager`, `aside`, `renderErrorTable`).
3. In each module that defines a global-exposed instance, export the concrete type (for example, `export type { ErrorTable } from './table';`).
4. Create a new typed augmentation file (example: `src/scripts/types/window.d.ts` or `src/scripts/types/window.ts`) with content like:

```ts
// src/scripts/types/window.d.ts (module-scoped)
import type { ErrorTable } from '../table';
import type { StatsManager } from '../stats';
import type { ChartManager } from '../charts';
import type { ErrorLoggerApp } from '../main';

declare global {
  interface Window {
    app?: ErrorLoggerApp;
    errorTableInstance?: ErrorTable;
    statsManager?: StatsManager;
    chartManager?: ChartManager;
    aside?: any; // keep permissive until Aside type is exported
    renderErrorTable?: (errors: any[]) => void;
  }
}

export {};
```

5. Remove the large ambient `global.d.ts` (or shrink it to a short README / compatibility aliases) once all modules import/export the concrete types and the new augmentation compiles cleanly.
6. Run `npx tsc --noEmit -p frontend` and fix remaining type errors; ensure CI passes.

Potential risks / mitigation
----------------------------
- Circular type imports: avoid `import`ing runtime modules inside `.d.ts` that execute code. Use `import type` and keep the augmentation in a module file (ending with `.ts` or `.d.ts` with top-level `import type`) to prevent runtime imports.
- Breaks if a field previously assumed to exist is removed: make fields optional (`?`) and keep a deprecation period with comments.

Acceptance criteria
-------------------
- `global.d.ts` no longer re-exports or contains large concrete types.
- A module-scoped `window` augmentation references actual exported types with `import type`.
- `npx tsc --noEmit -p frontend` passes.
- CI and runtime behavior remain unchanged.

Notes / examples
----------------
- If any module needs runtime access to the global `window` field, prefer to import the concrete type from its module and refer to it by `typeof` if needed.
- If we prefer a transitional approach, we can keep a small `global.d.ts` with `any` types for a short time and progressively tighten them.
