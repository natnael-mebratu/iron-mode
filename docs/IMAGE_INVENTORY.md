# Exercise image inventory

There are two kinds of picture, and the app never shows a generic or
mismatched image.

1. **Your gym photos** (`public/equipment/`). These are the 10 photos you sent,
   resized to 640 px with location/EXIF data removed. They show the actual
   machine on cards and on the My gym screen, labelled "Your gym".
2. **Online demo photos (off by default).** Start/finish photos from
   [Free Exercise DB](https://github.com/yuhonas/free-exercise-db), which
   declares itself public domain (Unlicense). Many of the photos appear to come
   from an older commercial fitness site, so their original licence is unclear.
   For that reason they are **not stored in this repository**: the app loads
   them from GitHub only if you switch on *My gym → Settings → Show demo
   photos*, and caches the ones you view for offline use. Every mapping below
   was checked by eye to show the right movement.

Where neither exists, the card shows an honest "No photo yet" placeholder and
the written setup/cues.

## Your gym photos

| File | What it shows | Used for |
|---|---|---|
| `multi-press.jpg` | Life Fitness multi-press (chest / incline / shoulder) | Machine chest, incline and shoulder press |
| `plate-incline-press-1.jpg`, `-2.jpg` | Plate-loaded incline press, two angles | Plate-loaded incline press |
| `chest-supported-row.jpg` | Plate-loaded chest-supported row ("ROW" label) | Chest-supported row, Kelso shrug |
| `plate-lat-pulldown.jpg` | Plate-loaded lat pulldown ("PULL DOWN" label) | Lat pulldown, single-arm pulldown |
| `preacher-bench.jpg` | Preacher bench with EZ bar | Preacher curls, spider curl, EZ-bar exercises |
| `bench-press-station.jpg` | Flat bench press station | Barbell bench press |
| `incline-bench-station.jpg` | Incline bench press station | (Library only) |
| `ab-bench.jpg` | Bench with foot rollers; kettlebells, plates and an ab wheel behind | Equipment list only |
| `mystery-plate-machine.jpg` | Plate-loaded machine with seat, thigh roller and foot plate: **seated calf raise** | Seated calf raise |

## Exercises

★ = hidden gem.

| Exercise | Equipment | Your gym photo | Online demo photo (checked by eye) |
|---|---|---|---|
| Machine chest press | Multi-press machine (chest, incline & shoulder press) | `multi-press.jpg` | `Machine_Bench_Press` |
| Machine incline press | Multi-press machine (chest, incline & shoulder press) | `multi-press.jpg` | **Missing** |
| Plate-loaded incline press | Plate-loaded incline press (each arm moves separately) | `plate-incline-press-1.jpg`, `plate-incline-press-2.jpg` | `Leverage_Incline_Chest_Press` |
| Low-incline dumbbell press | Dumbbells (full range), Adjustable / incline bench | — | `Incline_Dumbbell_Press` (Demo bench is steeper than recommended) |
| Flat dumbbell bench press | Dumbbells (full range), Adjustable / incline bench | — | `Dumbbell_Bench_Press` |
| Incline dumbbell fly | Dumbbells (full range), Adjustable / incline bench | — | `Incline_Dumbbell_Flyes` |
| Dumbbell pullover ★ | Dumbbells (full range), Adjustable / incline bench | — | `Bent-Arm_Dumbbell_Pullover` |
| Barbell bench press | Barbell and plates, Flat bench press station | `bench-press-station.jpg` | `Barbell_Bench_Press_-_Medium_Grip` |
| Push-up | Bodyweight | — | `Pushups` |
| Machine shoulder press | Multi-press machine (chest, incline & shoulder press) | `multi-press.jpg` | `Leverage_Shoulder_Press` (Demo machine differs from yours; the movement is the same) |
| Seated dumbbell shoulder press | Dumbbells (full range), Adjustable / incline bench | — | `Dumbbell_Shoulder_Press` |
| Dumbbell lateral raise | Dumbbells (full range) | — | `Side_Lateral_Raise` |
| Side-lying incline lateral raise ★ | Dumbbells (full range), Adjustable / incline bench | — | `One-Arm_Incline_Lateral_Raise` |
| Lu raise ★ | Dumbbells (full range) | — | **Missing** |
| Rope face pull | Cable station with rope attachment | — | `Face_Pull` |
| Chest-supported rear delt fly | Dumbbells (full range), Adjustable / incline bench | — | `Reverse_Flyes` |
| Plate-loaded lat pulldown | Plate-loaded lat pulldown | `plate-lat-pulldown.jpg` | `Wide-Grip_Lat_Pulldown` (Demo uses a cable pulldown; yours is plate-loaded) |
| Single-arm pulldown (plate-loaded) ★ | Plate-loaded lat pulldown | `plate-lat-pulldown.jpg` | **Missing** |
| Chest-supported row | Plate-loaded chest-supported row | `chest-supported-row.jpg` | `Leverage_Iso_Row` |
| Kelso shrug ★ | Plate-loaded chest-supported row | `chest-supported-row.jpg` | **Missing** |
| Chest-supported dumbbell row | Dumbbells (full range), Adjustable / incline bench | — | `Dumbbell_Incline_Row` |
| One-arm dumbbell row | Dumbbells (full range), Adjustable / incline bench | — | `One-Arm_Dumbbell_Row` |
| Rope straight-arm pulldown ★ | Cable station with rope attachment | — | `Rope_Straight-Arm_Pulldown` |
| Dumbbell shrug | Dumbbells (full range) | — | `Dumbbell_Shrug` |
| EZ-bar preacher curl | Preacher curl bench, EZ curl bar | `preacher-bench.jpg` | `Preacher_Curl` |
| Spider curl (preacher bench, vertical side) ★ | Preacher curl bench, EZ curl bar | `preacher-bench.jpg` | `Spider_Curl` |
| Incline dumbbell curl | Dumbbells (full range), Adjustable / incline bench | — | `Incline_Dumbbell_Curl` |
| Bayesian cable curl (facing away) ★ | Cable single handle (D-handle) | — | **Missing** |
| Rope cable curl | Cable station with rope attachment | — | **Missing** |
| Rope hammer curl | Cable station with rope attachment | — | `Cable_Hammer_Curls_-_Rope_Attachment` |
| Cross-body hammer curl ★ | Dumbbells (full range) | — | `Cross_Body_Hammer_Curl` |
| Preacher hammer curl | Preacher curl bench, Dumbbells (full range) | `preacher-bench.jpg` | `Preacher_Hammer_Dumbbell_Curl` |
| Zottman curl ★ | Dumbbells (full range) | — | `Zottman_Curl` |
| Reverse-grip EZ-bar curl | EZ curl bar | `preacher-bench.jpg` | `Reverse_Barbell_Curl` (Demo uses a straight bar) |
| Seated dumbbell wrist curl | Dumbbells (full range) | — | `Seated_Dumbbell_Palms-Up_Wrist_Curl` |
| Reverse wrist curl | Dumbbells (full range) | — | `Seated_Dumbbell_Palms-Down_Wrist_Curl` |
| Farmer's carry | Dumbbells (full range) | — | `Farmers_Walk` |
| Rope triceps pushdown | Cable station with rope attachment | — | `Triceps_Pushdown_-_Rope_Attachment` |
| Bench-supported dumbbell kickback | Dumbbells (full range), Adjustable / incline bench | — | `Tricep_Dumbbell_Kickback` |
| Overhead rope triceps extension ★ | Cable station with rope attachment | — | `Cable_Rope_Overhead_Triceps_Extension` |
| Leg press | Leg press machine | — | `Leg_Press` |
| Leg press, feet high & wide | Leg press machine | — | **Missing** |
| Single-leg leg press ★ | Leg press machine | — | **Missing** |
| Leg extension | Leg extension machine | — | `Leg_Extensions` |
| Dumbbell Bulgarian split squat | Dumbbells (full range), Adjustable / incline bench | — | `Split_Squat_with_Dumbbells` |
| Goblet squat | Dumbbells (full range) | — | `Goblet_Squat` |
| Dumbbell Romanian deadlift | Dumbbells (full range) | — | `Stiff-Legged_Dumbbell_Deadlift` |
| B-stance (kickstand) dumbbell RDL ★ | Dumbbells (full range) | — | **Missing** |
| Barbell hip thrust | Barbell and plates, Adjustable / incline bench | — | `Barbell_Hip_Thrust` |
| Rope cable pull-through | Cable station with rope attachment | — | `Pull_Through` |
| Single-leg glute bridge | Bodyweight | — | `Single_Leg_Glute_Bridge` |
| Copenhagen plank (short lever) ★ | Adjustable / incline bench | — | **Missing** |
| Standing side leg raise | Bodyweight | — | `Side_Leg_Raises` |
| Standing dumbbell calf raise (deep stretch) | Dumbbells (full range) | — | `Standing_Dumbbell_Calf_Raise` |
| Leg press calf raise | Leg press machine | — | `Calf_Press_On_The_Leg_Press_Machine` |
| Seated calf raise | Seated calf raise machine | `mystery-plate-machine.jpg` | `Seated_Calf_Raise` |
| Wall tibialis raise ★ | Bodyweight | — | **Missing** |
| Kneeling rope cable crunch | Cable station with rope attachment | — | `Cable_Crunch` |
| Kneeling ab wheel rollout | Ab wheel | — | `Ab_Roller` |
| Reverse crunch | Bodyweight | — | `Reverse_Crunch` |
| Pallof press (rope) ★ | Cable station with rope attachment | — | `Pallof_Press` |
| Dead bug | Bodyweight | — | `Dead_Bug` |
| Crunch | Bodyweight | — | `Crunches` |
| Plank | Bodyweight | — | `Plank` |

To add your own photo for an exercise, take a picture of the machine, save it in
`public/equipment/`, and add it to that machine's `photos` list in
`src/data/equipment.ts`.
