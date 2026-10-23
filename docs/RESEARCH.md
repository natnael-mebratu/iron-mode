# IRON MODE research notes

This document records what was researched, what was found, and how each finding
changed the app. Where evidence is thin or the sources disagree, it says so.

## 1. What's actually in the gym (from your 10 photos)

| Photo | Machine | Status in app |
|---|---|---|
| 2 | **Life Fitness multi-press**: one seat with *chest press, incline press and shoulder press* positions (sticker on the machine) | Available. This one machine unlocks incline and shoulder pressing |
| 3, 4 | **Plate-loaded incline press**; each arm moves separately | Available |
| 5 | **Plate-loaded chest-supported row** ("ROW" sticker, chest pad, wide + neutral handles). This is the "chest-supported for back" machine you couldn't name | Available |
| 7 | **Plate-loaded lat pulldown** ("PULL DOWN" sticker, thigh pads, each arm moves separately) | Available |
| 9 | **Preacher curl bench** with an **EZ curl bar** | Available |
| 8 | **Flat bench press station** + barbell | Available |
| 10 | **Incline bench press station** | Available |
| 6 | Bench with foot rollers; behind it: kettlebells, plate trees, an ab wheel, adjustable benches | Kettlebells, ab wheel, adjustable bench available |
| 1 | Plate-loaded machine with a seat, a roller over the thighs and a foot plate. **This looks like a seated calf raise.** | Left as "Not sure" because you said earlier there isn't one. Please check |

Also visible in the backgrounds: dumbbells to at least 55 kg, medicine balls, a
functional trainer/cable crossover and cardio machines. The cable D-handle,
straight bar, pull-up bar, Smith machine and back-extension bench are still
"Not sure". The app asks one yes/no question when one of them would unlock a
better exercise.

## 2. Hidden-gem exercises

Selection rules: each one must (a) work with confirmed equipment, (b) train a
muscle or angle the regular plan misses, or replace a machine the gym doesn't
have, and (c) be safe for a beginner with an irritable left elbow. They're
marked ★ in the app (Exercises → ★ Hidden gems).

| Exercise | Why it earns a place |
|---|---|
| **Kelso shrug** (on the chest-supported row) | Arms stay straight; you only pull the shoulder blades together. Targets mid/lower traps and rhomboids, which rows and normal shrugs underwork. Uses a machine you already have in a way most people don't. [1][2] |
| **Single-arm pulldown** (plate-loaded) | Your pulldown's arms move separately; going one arm at a time allows a slight lean and a deeper lat stretch, and evens out sides. |
| **Rope straight-arm pulldown** | Lat work with almost no elbow bending, so it's elbow-friendly and doesn't tire the biceps. |
| **Dumbbell pullover** | Old-school chest/lat movement in a long, stretched position; almost absent from modern programs. |
| **Side-lying incline lateral raise** | Lying sideways on an incline bench makes the bottom of the raise hard, where a standing raise is easiest. Targets the side delt in the stretched position. |
| **Lu raise** | Straight-arm raise to overhead with very light dumbbells (named after weightlifter Lu Xiaojun). Trains the shoulders through their full upward range. Mentioned in "underrated" coach lists but no research found, so it's an optional extra. |
| **Spider curl** (on the vertical side of your preacher bench) | Hardest at the top (short head / peak), the opposite of the preacher curl, which is hardest at the bottom. Commonly ranked with preacher curls as a top biceps isolation. [3][4] |
| **Bayesian cable curl** | Facing away from a low pulley so the arm is behind the body; keeps tension in the stretched position. Under study (a trial compares it with preacher cable curls) but early evidence. Needs a D-handle (not confirmed yet). [5][6] |
| **Cross-body hammer curl** | Shifts work to the brachialis, which adds arm thickness. |
| **Zottman curl** | Curl up palms-up, lower palms-down: biceps and forearm extensors in one move. |
| **Single-leg leg press** | Evens out a stronger leg and needs far less weight. |
| **B-stance (kickstand) RDL** | Nearly one-legged hamstring work without the balance problem of a true single-leg RDL. Main hamstring tool since there's no leg curl. |
| **Copenhagen plank (short lever)** | Inner-thigh (adductor) training without the adduction machine you don't have. Comes from football groin-injury prevention research (Harøy et al., 2019, *British Journal of Sports Medicine*; from background knowledge, not re-checked in this search). |
| **Wall tibialis raise** | Trains the front of the shin, which almost nobody trains; balances the calves. |
| **Pallof press (rope)** | Anti-rotation core work: resisting the twist trains the obliques as stabilisers. |
| **Overhead rope triceps extension** | Strongest evidence of the list (≈40% more triceps growth than pushdowns in a 12-week MRI study [7][8]). **But** it bends the elbow deeply under load, which can irritate the ulnar nerve [9][10], so it's hidden while elbow-friendly mode is on (the default). |

### Technique ideas from research, used in exercise cues

- **Train muscles in the stretched position.** Long-muscle-length training
  shows up repeatedly, e.g. lengthened-half leg extensions grew the quads more than
  full range in Pedrosa et al. (2022) [11]. A meta-analytic summary notes the
  evidence base is still small [12]. In the app: deep-stretch cues on calf
  raises and RDLs, and an optional "half reps in the bent-knee half" leg-extension
  finisher.
- **Calves grow from the bottom half.** Kassiano et al. (2023): partial reps in
  the stretched range grew the gastrocnemius ~15% vs ~7% for full range in 8
  weeks [13]. A 2025 study found a different pattern [14], so the cue is "pause
  in the deep stretch", not "only do half reps".

## 3. What good workout apps do (and what IRON MODE copied)

| Pattern | Where it's from | In IRON MODE |
|---|---|---|
| **"Previous" column** next to each set showing last time's weight × reps | Hevy [15] | Yes; previous values also pre-fill the inputs, so one tap logs a repeat |
| **Rest timer starts automatically** when a set is ticked, adjustable, with sound | Hevy [16] | Yes (−15/+15/skip, vibration + beep), and it stays accurate after the phone sleeps |
| Set types / RPE per set | Hevy [15] | Not added: extra jargon for a beginner. The symptom button and check-in matter more here |
| Warm-up and plate calculators | Hevy Pro [16] | Not yet (possible later) |
| Fast plain logging, templates, CSV export | Strong [17][18] | Plan templates, CSV + JSON export |
| Recovery-aware recommendations | Fitbod [19] | Simpler and transparent: optional energy/soreness check-in, with advice to go lighter. Never piles missed volume on later |
| Paywalls / subscriptions | Fitbod has no free tier; Hevy/Strong gate features [17][19] | None. Free, no account, no server |

## 4. Progression rules

**Double progression** is the standard beginner method: keep the weight until
every set reaches the top of the rep range, then add the smallest jump and
start again at the bottom of the range [20][21]. Coaching sources suggest
stopping sets about 1–3 reps short of failure for hypertrophy [21][22]. These
are coaching guidelines, not controlled-trial results.

IRON MODE implements exactly that, plus two safety rules from the brief:
- It **never increases** after a session where you flagged tingling or pain.
- It **never applies** a weight by itself; it only suggests one.

## 5. Elbow (ulnar nerve) safety

Sources agree that repeated or prolonged elbow bending can irritate the ulnar
nerve, and that gym work can be a trigger. They advise stopping exercises that
cause symptoms and building back gradually [9][10][23]. They differ on how
strictly to avoid weights, so a physio should set personal limits. In the app:

- **Elbow-friendly mode** (on by default) hides deep-elbow-flexion exercises.
- Every curl/elbow-heavy exercise carries a short stop rule.
- A **"Felt tingling / pain"** button on every exercise records the symptom,
  shows guidance, and blocks weight increases for that exercise next time.
- Elbow-light alternatives are preferred where possible (straight-arm
  pulldown, kickbacks, Kelso shrugs, carries).

This is general guidance, not a diagnosis.

## Sources

1. Strive: Kelso shrug, how to and muscles: https://strive-workout.com/2026/02/28/kelso-shrug/
2. Stronger app: machine row Kelso shrug: https://www.strongermobileapp.com/exercises/machine-row-kelso-shrug
3. Dumbbells Direct: preacher vs spider curl: https://dumbbellsdirect.com/blogs/fitness-insights-tips-gear/preacher-curl-vs-spider-curl
4. BarBend: underrated and overrated hypertrophy exercises: https://barbend.com/5-underrated-and-overrated-hypertrophy-exercises/
5. Men's Fitness: Bayesian curls: https://www.mensfitness.com/training/bayesian-curls-the-underrated-move-for-bigger-biceps
6. PMC: Bayesian vs preacher cable curl trial: https://pmc.ncbi.nlm.nih.gov/articles/PMC11906226/
7. BarBend: overhead extensions vs pushdowns study: https://barbend.com/overhead-triceps-extensions-vs-pushdowns-muscle-growth-study
8. Sci-Sport: triceps hypertrophy and arm position: https://sci-sport.com/en/triceps-hypertrophy-impact-of-arm-position/
9. HealthXchange (Singapore): cubital tunnel syndrome: https://www.healthxchange.sg/how-to-manage/cubital-tunnel-syndrome/cubital-tunnel-syndrome-how-to-treat
10. NHS Scotland: cubital tunnel syndrome leaflet: https://www.rightdecisions.scot.nhs.uk/media/dscm3fzw/cubital-tunnel-syndrome.pdf
11. FitCraft: lengthened partials research summary: https://getfitcraft.com/science/lengthened-partials-research
12. Stronger by Science: stretch-mediated hypertrophy: https://www.strongerbyscience.com/stretch-mediated-hypertrophy/
13. Kassiano et al. 2023, J Strength Cond Res (PubMed): https://pubmed.ncbi.nlm.nih.gov/37015016/
14. Larsen et al. 2025, past-failure partials (PMC): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12375417/
15. Hevy: track workouts: https://www.hevyapp.com/features/track-workouts/
16. Hevy Help Center: workout settings (timer, warm-up, plate calculator): https://help.hevyapp.com/hc/en-us/articles/33882110558743
17. Jefit: Fitbod vs Strong vs Jefit vs Hevy (competitor-written): https://www.jefit.com/blog/fitbod-vs-strong-vs-jefit-vs-hevy
18. Setgraph: Hevy vs Strong (vendor-written): https://setgraph.app/articles/hevy-vs-strong-app-comparison-2026
19. Fitbod: Fitbod vs Hevy (vendor-written): https://fitbod.me/blog/fitbod-vs-hevy-9-reasons-fitbod-beats-hevy/
20. FitBudd: double progression: https://www.fitbudd.com/academy/double-progression-definition-and-examples
21. RippedBody: progression: https://rippedbody.com/progression/
22. FitBudd: RIR guide: https://fitbudd.com/insights/rir-reps-in-reserve-the-complete-guide-for-fitness-professionals
23. Hinge Health: cubital tunnel syndrome: https://www.hingehealth.com/gb/en/resources/articles/cubital-tunnel-syndrome/

Several comparison sources are written by competing app makers; they were used
only for feature lists, not for judgements about quality.
