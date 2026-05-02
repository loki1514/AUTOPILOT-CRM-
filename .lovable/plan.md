I found one concrete issue in the dev-server logs that can keep causing the preview to appear broken after refreshes/restarts:

```text
[vite:css] @import must precede all other statements
src/index.css line 16
```

The app rendered in my browser session on `/crm`, so this is not currently the old `credits_remaining` crash. The visible page loads, but the preview server is still reporting a CSS compilation warning/error because `@import` is placed after Tailwind directives. That kind of Vite overlay/server state can make the canvas look blank or stuck for you even when the React route itself is OK.

Plan:

1. Fix the CSS import ordering
   - Move the Google Fonts `@import` in `src/index.css` to the very top of the file, before `@tailwind base`, `@tailwind components`, and `@tailwind utilities`.
   - Keep the Atmospheric Glass theme tokens and styles unchanged.

2. Remove the leftover runtime warning if it is coming from our app code
   - Investigate the “Function components cannot be given refs” warning shown in the browser console.
   - If it is caused by a local component wrapper, convert the relevant component to `React.forwardRef` or remove the invalid ref pass-through.
   - If it is only Lovable preview instrumentation and not app code, leave it alone.

3. Re-check the previously fixed `credits_remaining` path
   - Confirm `Integrations.tsx` still uses optional chaining / normalized integration status everywhere.
   - Search for any remaining direct `something.credits_remaining` access that could crash if a provider status is missing.

4. Verify the preview after the fix
   - Reload `/crm` and `/integrations`.
   - Check console logs for actual runtime errors.
   - Check dev-server logs again to confirm the CSS import warning is gone.

No database changes are needed for this fix.