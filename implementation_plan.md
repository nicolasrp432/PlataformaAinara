# Ainara Platform Finalization Plan

Goal: Transform Ainara into production-ready SaaS. Fix technical debt, complete missing modules, ensure luxury aesthetic.

## User Review Required

- Do we need to define specific Mentorship workflows (e.g., booking calls, chat) before starting step 3?
- Any specific third-party integrations needed for payments (Stripe) or video hosting?

## Proposed Changes

### Phase 1: Technical Debt & Stability
Fix build warnings and TypeScript strictness to ensure a solid foundation.

#### [MODIFY] lib/services/formationService.ts
- Remove explicit `any` types in mapping functions. Use proper Supabase generated types or defined interfaces.
- Change `let payload` to `const payload` to fix `prefer-const` lint error.

#### [MODIFY] lib/data-access.ts
- Replace explicit `any` types across the data-fetching layer with accurate types to eliminate ESLint warnings.

#### [MODIFY] lib/services/storageService.ts
- Remove unused `data` variable in `uploadPublicAsset`.

### Phase 2: Schema & Data Consistency
Ensure database schema fully supports the application's intended feature set.

- Verify `enrollments` table integration.
- Verify `mentors` and `mentorship_sessions` tables match UI needs.

### Phase 3: Missing Feature Implementation
Build out the incomplete modules.

- **Admin UI:** Complete CRUD for Formations, Modules, and Lessons. Ensure video uploads and rich text editing work properly.
- **Mentorship Module:** Implement user-facing booking and mentor profiles.
- **Community (La Taberna):** Enhance reflection sharing and user interactions.

### Phase 4: Performance & Aesthetics
Final polish.

- Ensure "Luxury Gold" design system is strictly enforced.
- Verify hydration mismatch issues are completely resolved.
- Check skeleton loaders and `React.cache` behavior for zero-latency feel.

## Verification Plan

### Automated Tests
- Run `npm run lint` and `npm run build` to verify zero errors or warnings.

### Manual Verification
- Test full auth flow.
- Test Admin CRUD for a formation.
- Test user enrollment and progress tracking.
