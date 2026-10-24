# IRON MODE

A free, mobile-first workout tracker built around the equipment that's actually
at your gym. It runs in the browser, installs to your home screen, works
offline, and keeps your data on your phone. No account, no server, no
subscription.

## Features

**Workout (daily screen)**
- Pick a day (Sat → Fri) and see that day's session. Each exercise card shows
  a photo of *your gym's machine* where available, target muscles, sets × reps
  and rest. Tap a card for setup, form cues, common mistakes and safety notes.
- Log **kg × reps** per set. The **Previous** column shows last time's numbers,
  and they pre-fill the inputs, so repeating a set is one tap.
- **Progression tips** (double progression): a heavier weight is only suggested
  when every set hit the top of the rep range. It never changes the weight on
  its own, and never suggests more after you flagged symptoms.
- **Rest timer** starts when you tick a set (−15 / +15 / skip, vibration +
  beep). It stays accurate if the phone sleeps.
- **"Felt tingling / pain" button** on every exercise.
- Optional energy/soreness **check-in**, a gentle note on Wednesday/Friday
  fasting days, and a **workout summary** with new best weights.
- Rest day but want to train? Pick any session for today; your weekly plan
  doesn't change and the log keeps that session.

**Swapping and rebuilding**
- Every exercise has a **⇄ Swap exercise** button. Pick a replacement (same sets and reps); only exercises your gym
  can do are offered. Machine busy today? Swap just for today. Prefer another exercise? Tick **Use it every time**.
- Exercises that need equipment you haven't confirmed appear under *Need equipment confirmed*. Answer yes/no and
  they move up to *Available now*.
- The workout **rebuilds itself whenever your equipment changes** and tells you what changed. Sets you've already
  logged are never hidden, even if the plan changes underneath them.

**Profiles**
- Several people can use one phone, each with their own gym, plan, history and settings (tap your name, top right).
- New people pick their own gym (or copy someone else's) and start with a clean slate. Existing data from before
  profiles became your first profile automatically.
- Share the app from the Profile screen. Everyone's data stays on their own phone.

**Plan**
- Your **current 5-day split** (Shoulders+Arms / Legs A / Chest+Triceps /
  Back+Biceps / Legs B), rebuilt around your machines.
- Optional **beginner 3-day Push/Pull/Legs**, with a plain-language explanation.
- Swap days without losing anything.

**Exercises**
- 64 exercises, including 16 **★ hidden gems** (lesser-known exercises chosen
  for a reason; see [docs/RESEARCH.md](docs/RESEARCH.md)).
- Filters: *At my gym*, *Hidden gems*, *All*. Items your gym lacks are labelled
  **NOT AVAILABLE AT MY GYM**.

**Progress**
- Workout history, per-exercise progress chart, optional body weight and waist
  tracking with charts, and a short note on why ab exercises can't target
  lower-belly fat.
- **Backup:** save a `.json` backup, export `.csv` for spreadsheets, and restore
  with validation and a preview. *Merge* never overwrites days you already
  have; *Replace* downloads a copy of your current data first.

**My gym**
- Every machine with your photos and a Have it / Not sure / Don't have switch.
  "Not sure" counts as not available.
- Settings: elbow-friendly mode (on by default), online demo photos (off by
  default, see below), timer sound.

## Photos

- `public/equipment/` holds **your own gym photos**, resized, with location
  data removed.
- **Online demo photos** come from [Free Exercise DB](https://github.com/yuhonas/free-exercise-db),
  which calls them public domain. Many seem to come from an older commercial
  site, so they are *not* stored in this repo. They load only if you turn them
  on, and ones you've viewed are cached for offline use.
- Full list: [docs/IMAGE_INVENTORY.md](docs/IMAGE_INVENTORY.md).

## Your data

Everything is stored in your browser's `localStorage` on your phone, per profile. Clearing
browser data or uninstalling deletes it, so use **Progress → Save backup**
now and then. Old data is upgraded automatically when the app updates.

## Run locally

Requires Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:5173/iron-mode/
npm test           # unit tests (vitest)
npm run typecheck
npm run build      # production build + service worker in dist/
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
4. On your phone, open that address → browser menu → **Add to Home screen**.

The site is served from `/iron-mode/` (set in `vite.config.ts`). If you rename
the repository, change `base` and the manifest `start_url`/`scope` there to
match.

## Project layout

```
src/data/equipment.ts   gym equipment, default availability, your photos
src/data/exercises.ts   exercise library (incl. hidden gems and demo photo ids)
src/data/plans.ts       workout plans (each slot lists preferred exercise first, then substitutes)
src/lib/resolve.ts      picks the exercise for each slot (plan, swap or already-logged) and lists swap alternatives
src/lib/install.ts      install prompt + browser detection (install help)
src/lib/progression.ts  previous performance and double-progression suggestions
src/lib/storage.ts      profiles store, saved state, validation, migration, merge
src/lib/backup.ts       JSON/CSV export and validated import
src/screens/            Workout, Plan, Progress, Exercises, My gym
docs/RESEARCH.md        research behind the exercises, app design and safety rules
```

## Safety

Stop any exercise that causes an electric-shock feeling, tingling, numbness or
pain, and get recurring symptoms checked by a professional. The app gives
general guidance only and isn't medical advice.
