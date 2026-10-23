# Exercise image inventory

**Status: no exercise photos are in the repository yet.** Every exercise
shows an honest "Photo needed" placeholder until a real image is added. No
generic or mismatched image is used.

## How to add a photo

1. Pick a photo that shows **this exact movement on this equipment**, and that
   you're allowed to use (your own photo, or a free licence such as CC0 or
   CC BY. Note any credit the licence requires).
2. Save it as `public/exercises/<exercise-id>.jpg` (ids are in
   `src/data/exercises.ts`). Keep it under ~150 KB, square-ish crop.
3. Add to that exercise in `src/data/exercises.ts`:
   ```ts
   image: { src: "exercises/<exercise-id>.jpg", alt: "Person doing …", attribution: "Photo: … (CC BY 4.0)" },
   ```
4. Update the table below.

Machines marked unavailable at the gym (seated leg curl, seated calf raise,
hip abduction, hip adduction) have no exercises in the library, so they need no
photos.

| Exercise | Muscle group | Equipment shown | Photo status |
|---|---|---|---|
| Machine chest press | Chest | Chest press machine | Missing |
| Incline machine chest press | Chest | Incline chest press machine | Missing |
| Pec deck fly | Chest | Pec deck / chest fly machine | Missing |
| Standing cable chest fly | Chest | Cable single handle (D-handle) | Missing |
| Push-up | Chest | Bodyweight | Missing |
| Seated dumbbell shoulder press | Shoulders | Dumbbells, Adjustable / incline bench | Missing |
| Dumbbell lateral raise | Shoulders | Dumbbells | Missing |
| Single-arm cable lateral raise | Shoulders | Cable single handle (D-handle) | Missing |
| Rope face pull | Shoulders | Cable station with rope attachment | Missing |
| Lat pulldown | Back | Lat pulldown machine | Missing |
| Seated cable row | Back | Seated cable row | Missing |
| Standing rope cable row | Back | Cable station with rope attachment | Missing |
| Straight-bar cable curl | Biceps | Cable straight-bar attachment | Missing |
| EZ-bar cable curl | Biceps | Cable EZ-bar attachment | Missing |
| Rope cable curl | Biceps | Cable station with rope attachment | Missing |
| Rope hammer curl | Biceps | Cable station with rope attachment | Missing |
| Incline dumbbell curl | Biceps | Dumbbells, Adjustable / incline bench | Missing |
| Seated dumbbell wrist curl | Forearms | Dumbbells | Missing |
| Rope triceps pushdown | Triceps | Cable station with rope attachment | Missing |
| Leg press | Legs | Leg press machine | Missing |
| Leg extension | Legs | Leg extension machine | Missing |
| Lying leg curl | Legs | Lying leg curl machine | Missing |
| Rope cable pull-through | Legs | Cable station with rope attachment | Missing |
| Glute bridge | Legs | Bodyweight | Missing |
| Standing calf raise (bodyweight) | Legs | Bodyweight | Missing |
| Leg press calf raise | Legs | Leg press machine | Missing |
| Crunch | Abs | Bodyweight | Missing |
| Kneeling rope cable crunch | Abs | Cable station with rope attachment | Missing |
| Reverse crunch | Abs | Bodyweight | Missing |
| Dead bug | Abs | Bodyweight | Missing |

