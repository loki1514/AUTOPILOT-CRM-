I checked the live preview and the `/` dashboard is rendering in my browser session, but the dev overlay is reporting build-blocking TypeScript errors. That can make the preview appear blank or unusable for you, especially if the error overlay is active.

Plan to fix it:

1. Resolve the Daily Brief action callback type errors
   - Update `DailyPulseView.tsx` so `onAddToLeads` and `onEnrich` callbacks return `Promise<void>` as expected by `BriefCompanyCard`.
   - Keep the existing behavior: add/enrich still runs, invalidates queries, and shows the existing toast messages.

2. Fix lead data typing issues
   - Update `useLeads.ts` to safely cast backend rows to the app `Lead` type without TypeScript rejecting JSON fields like `disqualified_claims`.
   - Fix the single-lead query flow where `.single()` is being called before role-based filtering, which causes `.eq()` to be unavailable afterward.
   - Keep role behavior intact: reps only see assigned leads, admins/master admins see all allowed leads.

3. Fix the missing `LeadContact` export import
   - Update `useLeadsWithContacts.ts` to import `LeadContact` from the shared app types instead of from `useLeadContacts`, since `useLeadContacts` does not export that type.

4. Fix source-name mismatch on Dashboard
   - Update the `LeadSource` type to include the source value currently used by the app: `daily_brief`.
   - This matches `useConvertBriefItem.ts`, which inserts leads with `source: "daily_brief"`, and removes the Dashboard comparison error.

5. Fix test-only typing errors
   - Add `source_type` to the shared scoring `SignalLike` interface, since scoring already reads it and tests correctly validate it.
   - Adjust the two overly narrow test variables in `security.test.ts` so TypeScript doesn’t infer impossible literal comparisons like `'admin' === 'rep'` or `hostname.endsWith(...)` on `never`.

6. Verify runtime-specific blank screen cause
   - After implementation, reload the preview and inspect console output.
   - The remaining console warning about function components receiving refs appears non-fatal; I’ll only address it if it is still connected to the blank screen after the build errors are cleared.

No database or backend schema changes are needed for this fix.