# Demand Dashboard

A production-ready demand user dashboard for a marketplace scenario similar to Trustoo. The experience focuses on managing service requests, collaborating with providers through rich chat, comparing offers side by side, and leveraging AI guidance to understand quotes.

## Features

- **Dashboard overview** with status filters, search, and sorting.
- **Request detail workspace** featuring:
  - Status stepper, editable description, attachment management, and reminders.
  - **Chats tab** with up to four provider conversations, quick replies, attachments, unread indicators, typing status, and live socket updates.
  - **Compare tab** for side-by-side provider evaluation, smart highlights, fit score rationale, PDF export, shareable summary, and saved snapshots.
  - **Guidance tab** powered by AI quote analysis with suggested questions, risk flags, checklist items, and fit score updates.
- **React Query** backed data fetching with MSW REST mocks and a socket simulator for live messages.
- **Zustand** for local UI state (chat selection, compare choices, composer drafts).
- **Telemetry instrumentation** for core actions (request open, message sent, quote upload, comparison, etc.).
- **Accessibility-first UI** using Tailwind and shadcn-inspired primitives (focus management, keyboard navigation, WCAG AA contrast).

## Tech Stack

- React 18 + TypeScript
- React Router 6
- Tailwind CSS & shadcn-style components
- @tanstack/react-query + React Query Devtools
- Zustand state management
- MSW for REST mocks and Socket simulator for live updates
- Jest + React Testing Library component tests

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server with MSW mocking:
   ```bash
   npm run dev
   ```
   The app is available at [http://localhost:5173](http://localhost:5173).
3. Run tests:
   ```bash
   npm test
   ```

## Project Structure

```
src/
  api/              // REST client and socket simulator
  components/       // Layout primitives
  features/         // Chats, compare, and guidance modules
  mocks/            // MSW data and handlers
  pages/            // Dashboard and request detail routes
  state/            // Zustand stores
  telemetry/        // Telemetry context & hook
  utils/            // Shared helpers
```

## Telemetry Events

Key events emitted to the telemetry provider include:

- `request_opened`
- `message_sent`
- `quote_uploaded`
- `compare_started`
- `provider_selected`
- `reminder_set`
- `description_edited`
- `compare_shared`
- `compare_exported`

The current count of captured events displays in the top navigation.

## Testing

Jest and React Testing Library power component coverage:

- `computeFitScore` logic unit tests
- Compare workspace sticky header + smart highlight
- Chat workspace unread indicator and focus hand-off on provider switch

Run `npm test` to execute the suite.

## Accessibility & Best Practices

- Semantic markup with ARIA roles for tablists, tabpanels, grids, lists, and status messaging
- Keyboard navigation support with focus outlines and skip links
- WCAG AA palette ensured via Tailwind theme extensions

## Mock Data

MSW seeds realistic request, provider, chat, fit score, and quote analysis data enabling end-to-end workflows without a backend.

