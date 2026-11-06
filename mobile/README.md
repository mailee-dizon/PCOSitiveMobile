# PCOSitive Buddy — mobile

React Native (Expo) version of the web app in `../client`.

## Setup

1. Copy `.env.example` to `.env.local` and fill in the values:
   - `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` — same Supabase project as the web client.
   - `EXPO_PUBLIC_API_URL` (optional): only needed to point at a deployed server. In development
     the app finds `../server` on your computer automatically.
2. `npm install`
3. `npx expo start`, then press `i` (iOS simulator), `a` (Android), or scan the QR code with Expo Go.

For Chloe and Exercise to work, also start the server: `cd ../server && .venv/bin/python main.py`
(see `../server/README.md`).

## How it maps to the web app

| Web (`client/`)                         | Mobile (`mobile/src/`)                   |
| --------------------------------------- | ---------------------------------------- |
| `app/page.tsx` (waitlist)               | `app/index.tsx`                          |
| `app/login`, `components/AuthForm`      | `app/login.tsx`                          |
| `app/questionnaire`                     | `app/questionnaire.tsx`                  |
| `app/(protected)/*`                     | `app/(tabs)/*`                           |
| `ProtectedRoute`, `OnboardingRedirect`  | `context/auth.tsx` + `Stack.Protected` in `app/_layout.tsx` |
| `api/period`, `api/symptoms`, `api/emails` | `lib/data.ts` (calls Supabase directly) |
| `api/chloe/chat`                        | `lib/server.ts` → `../server/main.py`    |
| `api/exercise`                          | `lib/server.ts` → Railway model server   |

Password reset emails link to the website's `/reset-password` page (set `EXPO_PUBLIC_WEB_URL`).

## Checks

```bash
npx tsc --noEmit
npx expo lint
```
