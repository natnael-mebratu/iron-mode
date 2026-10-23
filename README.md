# IRON MODE

A free, mobile-first workout tracker built around the equipment that's actually
at your gym. It runs in the browser, keeps your data on your device, and
needs no account or server.

## What works now (Phase 1)

- **Workout screen.** Pick a day (Sat → Fri) and see that day's session. Each
  exercise card shows target muscles, equipment, sets × reps, rest, a "How to
  do it" panel (setup, form cues, common mistakes) and short safety notes.
  Tap each set when it's done.
- **Equipment-aware plans.** Exercises are only assigned when *all* their
  equipment is marked "Have it". The defaults are the four confirmed machines
  (chest press, cable station with rope, leg press, leg extension). Seated leg
  curl, seated calf raise and the hip abduction/adduction machines are marked
  unavailable. Everything else is "Not sure", which counts as not available.
  If a better exercise needs unconfirmed equipment, the card shows a
  **Substitute** badge and asks one yes/no question.
- **Two plans.** Your current 5-day split, plus an optional beginner 3-day
  Push/Pull/Legs. Switch on the **Plan** tab. Days can be swapped without
  losing a session.
- **Exercise library** with availability labels (including **NOT AVAILABLE AT
  MY GYM**).
- **My gym.** Mark each item "Have it", "Not sure" or "Don't have".
- Set ticks, plan choice, day arrangement and equipment are saved in the
  browser (`localStorage`) and survive a refresh.

## Not built yet

- Weight/reps logging, last-session values, progression suggestions
- Rest timer
- Workout history, body weight and charts
- CSV/JSON export and import
- PWA install and offline support
- Exercise photos. See [docs/IMAGE_INVENTORY.md](docs/IMAGE_INVENTORY.md). All
  exercises currently show a "Photo needed" placeholder.

## Run locally

Requires Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:5173/iron-mode/
npm test           # unit tests
npm run typecheck
npm run build      # production build in dist/
npm run preview    # serve the build at http://localhost:4173/iron-mode/
```

To try it on your phone while developing, run `npm run dev -- --host` and open
the "Network" address on the same Wi-Fi.

## Deploy to GitHub Pages (free)

1. Add the workflow: on GitHub choose **Add file → Create new file**, name it
   `.github/workflows/deploy.yml`, and paste in the contents of
   [`docs/github-pages-deploy.yml`](docs/github-pages-deploy.yml). (It lives in
   `docs/` because the automated session that created this repo wasn't allowed
   to add workflow files.)
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `main`. The workflow tests, builds and publishes to
   `https://<your-username>.github.io/iron-mode/`.

The site is served from `/iron-mode/` (set in `vite.config.ts`). If you rename
the repository, change `base` there to match.

## Project layout

```
src/data/equipment.ts   gym equipment + default availability
src/data/exercises.ts   exercise library
src/data/plans.ts       workout plans (slots list preferred exercise first, then substitutes)
src/lib/resolve.ts      picks the exercise for each slot from available equipment
src/lib/storage.ts      saved state + validation
src/screens/            Workout, Plan, Exercises, My gym
```

## Safety

Stop any exercise that causes an electric-shock feeling, tingling, numbness or
pain, and get recurring symptoms checked by a professional. The app shows
general guidance only and isn't medical advice.
