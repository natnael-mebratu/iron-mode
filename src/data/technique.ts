// Coaching cues for making the *target* muscle do the work. Each entry says
// where the user should feel the exercise (and where they shouldn't), plus a
// few technique points in plain but precise language. General principles that
// apply to many exercises live in TECHNIQUE_BASICS below.

export interface Technique {
  /** Where the exercise should be felt, and common wrong places. */
  feel: string;
  /** Technique that shifts the work onto the target muscle. First two are shown on the workout card. */
  tips: string[];
}

const PRESS_SETUP =
  "Set your shoulder blades first: pull them back and down (\"back pockets\") and keep them pinned for the whole set.";
const PRESS_ELBOWS = "Elbows about 45–60° from your body (an arrow shape, not a T). Flaring to 90° shifts stress onto the front of the shoulder.";
const PRESS_WRISTS = "Wrists stacked straight over the elbows at the bottom; don't let them bend back.";

export const TECHNIQUE: Record<string, Technique> = {
  // Chest
  "chest-press-machine": {
    feel: "Middle of the chest, some front shoulder and triceps. Mostly front shoulder? Your shoulder blades have come off the pad.",
    tips: [PRESS_SETUP, PRESS_ELBOWS, "Slight arch in the upper back (chest proud), lower back natural. Hips stay on the seat.", "Think \"squeeze the arms together\" as you press, not just \"push forward\"."],
  },
  "machine-incline-press": {
    feel: "Upper chest, just under the collarbones. Feeling it mainly in the shoulders means the seat is too low or the shoulders are rolling forward.",
    tips: [PRESS_SETUP, PRESS_ELBOWS, "Seat height so the handles start at upper-chest level, not at the shoulders.", "Keep your chest up toward the handles throughout."],
  },
  "plate-incline-press": {
    feel: "Upper chest, then front shoulder and triceps.",
    tips: [PRESS_SETUP, PRESS_ELBOWS, "Press up and slightly inward; the handles naturally converge. Follow them.", "Work one arm at a time for a set if one side is weaker."],
  },
  "low-incline-db-press": {
    feel: "Upper chest. If the shoulders take over, lower the bench angle.",
    tips: [PRESS_SETUP, PRESS_ELBOWS, PRESS_WRISTS, "Lower the dumbbells to the sides of the chest, not toward the face."],
  },
  "db-bench-press": {
    feel: "Whole chest with a strong stretch at the bottom.",
    tips: [PRESS_SETUP, PRESS_ELBOWS, PRESS_WRISTS, "Feet planted and pushing into the floor. A small upper-back arch is good; the backside stays on the bench."],
  },
  "incline-db-fly": {
    feel: "A stretch across the upper chest at the bottom, a squeeze at the top. Biceps or front shoulders burning means the weight is too heavy.",
    tips: [PRESS_SETUP, "Lock a soft bend into the elbows and keep it fixed; movement only happens at the shoulders.", "Open until you feel a stretch, not until the elbows drop below the bench.", "Bring the dumbbells together over the upper chest as if hugging a barrel."],
  },
  "db-pullover": {
    feel: "Stretch along the sides of the ribcage (lats) and chest. Not in the elbows.",
    tips: ["Keep the elbow bend fixed; if it changes, the triceps take over.", "Ribs down: don't let the lower back arch hard as the weight goes behind the head.", "Stop where the stretch is strong but comfortable; that's your range."],
  },
  "barbell-bench-press": {
    feel: "Chest, front shoulders, triceps.",
    tips: [PRESS_SETUP, PRESS_ELBOWS, "Bar touches the lower chest (around nipple line), then presses up and slightly back over the shoulders.", "Grip a little wider than shoulder-width; forearms vertical at the bottom."],
  },
  "push-up": {
    feel: "Chest and triceps; core working to stay straight.",
    tips: ["Hands just outside the shoulders, elbows about 45° from the body.", "Squeeze the glutes and brace the stomach so the body moves as one plank.", "Let the shoulder blades come together at the bottom and push the floor away at the top."],
  },

  // Shoulders
  "machine-shoulder-press": {
    feel: "Front and side of the shoulders, triceps. Lower-back strain means you're arching to press.",
    tips: ["Back flat against the pad; brace the stomach.", "Elbows slightly in front of the body, not flared straight out to the side.", "Stop just short of lockout to keep tension on the shoulders."],
  },
  "db-shoulder-press": {
    feel: "Front and side shoulders.",
    tips: ["Dumbbells start at ear level, elbows slightly forward of the body.", "Press up and slightly in, without clanging the weights.", "Ribs down; don't lean back to finish the rep."],
  },
  "db-lateral-raise": {
    feel: "Side of the shoulder (the round outer part). Feeling it in the neck/traps means you're shrugging or going too heavy.",
    tips: ["Lead with the elbows, not the hands; think \"push the dumbbells out to the walls\".", "Slight forward lean and arms slightly in front of the body (about 15–30°) lines the movement up with the side delt.", "Stop at shoulder height; going higher mostly works the traps.", "Shoulders down away from the ears the whole time."],
  },
  "incline-side-lateral": {
    feel: "Side delt, especially at the start of the lift.",
    tips: ["Keep the shoulder blade pinned down; don't let the shoulder shrug up.", "Raise in line with the body, not forward.", "Use about half your normal lateral-raise weight."],
  },
  "lu-raise": {
    feel: "Side and front shoulders, upper traps near the top.",
    tips: ["Arms straight, thumbs up so the shoulder rotates comfortably.", "Slow and smooth through the full arc; no swinging.", "Weight should be very light. Range matters more than load here."],
  },
  "rope-face-pull": {
    feel: "Back of the shoulders and between the shoulder blades.",
    tips: ["Pull toward the eyes/forehead with elbows high, at or slightly above the hands.", "Finish by rotating the hands back, like a double-biceps pose.", "Stand tall; no leaning back."],
  },
  "rear-delt-fly": {
    feel: "Back of the shoulders. Feeling it mostly between the shoulder blades means you're squeezing them together too much.",
    tips: ["Let the shoulder blades stay relaxed/spread; move only at the shoulders.", "Raise the arms out wide (not back toward the hips).", "Pinkies slightly up, small pause at the top."],
  },

  // Back
  "lat-pulldown": {
    feel: "Lats: the wide muscles along the sides of the back, under the armpits. Mostly biceps? You're pulling with the hands instead of the elbows.",
    tips: ["Start each rep by pulling the shoulders down (away from the ears), then bend the elbows.", "Think \"elbows to back pockets\"; hands are just hooks. A thumbless grip can help.", "Slight lean back, chest up toward the handles.", "Let the arms fully stretch at the top every rep."],
  },
  "single-arm-pulldown": {
    feel: "One lat at a time, with a deep stretch at the top.",
    tips: ["Lean slightly toward the working side.", "Drive the elbow down and in toward your hip.", "Pause in the full stretch at the top before each rep."],
  },
  "chest-supported-row": {
    feel: "Neutral (vertical) handles, elbows close to the body: lats. Wide handles, elbows out: upper back and rear delts.",
    tips: ["Chest stays glued to the pad; no heaving.", "Lead with the elbows; squeeze the shoulder blades together at the end.", "Reach forward and let the shoulder blades spread at the start of every rep. That stretch matters.", "Don't shrug; keep the neck long."],
  },
  "kelso-shrug": {
    feel: "Between and below the shoulder blades (mid/lower traps).",
    tips: ["Arms stay completely straight.", "Pull the shoulder blades back and slightly down, not up toward the ears.", "Hold the squeeze for a second; small movement, big contraction."],
  },
  "incline-db-row": {
    feel: "Mid back and lats.",
    tips: ["Chest stays on the bench.", "Elbows at about 45° for upper back, close to the body for lats.", "Full stretch at the bottom, squeeze at the top."],
  },
  "one-arm-db-row": {
    feel: "Lat on the working side.",
    tips: ["Pull the dumbbell back toward the hip in an arc, not straight up to the chest.", "Flat back, hips square to the floor.", "Let the shoulder blade stretch forward at the bottom."],
  },
  "rope-straight-arm-pulldown": {
    feel: "Lats. Triceps burning? The elbows are bending.",
    tips: ["Arms almost straight the whole time.", "Hinge forward slightly and keep the chest still.", "Pull the rope down and back to the thighs, squeezing the lats at the bottom."],
  },
  "db-shrug": {
    feel: "Top of the shoulders/neck (upper traps).",
    tips: ["Shrug straight up toward the ears; no rolling.", "Arms straight; the elbows don't bend.", "Pause at the top for a second."],
  },

  // Biceps
  "ez-preacher-curl": {
    feel: "Biceps, especially near the elbow at the bottom of the rep.",
    tips: ["Back of the upper arm stays flat on the pad.", "Lower under control all the way to almost straight; this is the important part.", "Don't let the shoulders roll forward to lift the weight."],
  },
  "spider-curl": {
    feel: "Biceps, strongest squeeze at the top.",
    tips: ["Upper arms hang straight down and don't move.", "Curl up and squeeze hard for a second at the top.", "Lower all the way to straight arms."],
  },
  "incline-db-curl": {
    feel: "Biceps, with a stretch at the bottom (long head).",
    tips: ["Let the arms hang straight down behind the body.", "Keep the elbows from swinging forward as you curl.", "Turn the palms up (supinate) as you lift."],
  },
  "bayesian-curl": {
    feel: "Biceps, with a stretch at the bottom.",
    tips: ["Keep the upper arm slightly behind the body all set.", "Curl without letting the elbow drift forward.", "Full stretch at the bottom of each rep."],
  },
  "rope-cable-curl": {
    feel: "Biceps and forearm.",
    tips: ["Elbows pinned at the sides.", "Twist the pinkies up and out at the top for a stronger squeeze.", "Lower slowly."],
  },
  "rope-hammer-curl": {
    feel: "Outer upper arm and top of the forearm (brachialis, brachioradialis).",
    tips: ["Thumbs up the entire time.", "Elbows stay at your sides; only the forearms move.", "Lower slowly for 2–3 seconds."],
  },
  "cross-body-hammer-curl": {
    feel: "Outer upper arm (brachialis).",
    tips: ["Curl the dumbbell across the body toward the opposite chest.", "Thumbs up; elbow stays close to the body.", "Alternate arms, slow lowering."],
  },
  "preacher-hammer-curl": {
    feel: "Outer upper arm and forearm.",
    tips: ["Back of the arm flat on the pad.", "Thumbs up throughout.", "Lower to almost straight under control."],
  },

  // Forearms
  "zottman-curl": {
    feel: "Biceps on the way up, top of the forearm on the way down.",
    tips: ["Curl up palms up, turn palms down at the top.", "Lower slowly palms down (3 seconds).", "Turn back to palms up at the bottom."],
  },
  "reverse-ez-curl": {
    feel: "Top of the forearm and outer upper arm.",
    tips: ["Wrists straight, in line with the forearms.", "Elbows at the sides.", "Lighter than your normal curl."],
  },
  "db-wrist-curl": {
    feel: "Inner forearm.",
    tips: ["Forearms stay on the thighs.", "Let the dumbbell roll toward the fingertips, then curl the wrist up.", "Light weight, high reps."],
  },
  "db-reverse-wrist-curl": {
    feel: "Top of the forearm.",
    tips: ["Forearms stay on the thighs.", "Lift the knuckles only.", "Very light weight."],
  },
  "farmers-carry": {
    feel: "Grip, forearms, upper back, core.",
    tips: ["Stand tall, shoulders back and down.", "Squeeze the handles hard.", "Short, steady steps; don't lean."],
  },

  // Triceps
  "rope-triceps-pushdown": {
    feel: "Back of the upper arm. Feeling it in the shoulders or chest means you're leaning over the rope.",
    tips: ["Elbows tucked to the sides and fixed; only the forearms move.", "At the bottom, spread the rope apart and fully straighten the arms.", "Slight forward lean is fine; don't push with body weight."],
  },
  "db-kickback": {
    feel: "Back of the upper arm, strongest at full extension.",
    tips: ["Upper arm parallel to the floor and still.", "Straighten the arm fully and squeeze for a second.", "Light weight; swinging means it's too heavy."],
  },
  "rope-overhead-extension": {
    feel: "Back of the upper arm with a stretch at the bottom (long head).",
    tips: ["Elbows point forward, not out.", "Ribs down; don't arch the lower back.", "Light weight and stop at the first sign of elbow tingling."],
  },

  // Quads
  "leg-press": {
    feel: "Front of the thighs and glutes. Lower-back pressure means you're going too deep for your hips.",
    tips: ["Lower back and hips stay pressed into the pad. Only go as deep as you can without the hips curling up.", "Knees track in line with the toes; don't let them cave in.", "Push through the whole foot, mostly mid-foot.", "Stop just short of locking the knees at the top."],
  },
  "leg-press-high-feet": {
    feel: "Glutes and hamstrings more than quads.",
    tips: ["Feet high and a bit wide, toes slightly out.", "Push through the heels.", "Go deep while the lower back stays down."],
  },
  "single-leg-press": {
    feel: "Front of the thigh and glute on the working side.",
    tips: ["Foot in the middle of the platform.", "Knee follows the toes.", "Use about 40% of your two-leg weight to start."],
  },
  "leg-extension": {
    feel: "Front of the thighs.",
    tips: ["Knee lined up with the machine's pivot.", "Hold the handles and pull yourself into the seat so the hips don't lift.", "Lean back slightly to stretch the front-thigh muscle (rectus femoris) more.", "Pause at the top, lower slowly."],
  },
  "bulgarian-split-squat": {
    feel: "Front leg's thigh and glute. Back leg should barely work.",
    tips: ["Torso upright and front knee forward for more quads; lean forward slightly for more glutes.", "Drop straight down; the back knee heads toward the floor.", "Most of your weight in the front foot."],
  },
  "goblet-squat": {
    feel: "Thighs and glutes.",
    tips: ["Hold the weight close to the chest.", "Sit down between the heels; knees push out over the toes.", "Chest up, heels down."],
  },

  // Hamstrings & glutes
  "db-rdl": {
    feel: "Back of the thighs (hamstrings) stretching as you go down. Lower back aching means the back is rounding or you're going too low.",
    tips: ["Push the hips straight back like closing a car door with your backside.", "Knees slightly bent and fixed. This is not a squat.", "Keep the dumbbells touching the legs all the way.", "Go down only until the hamstrings are stretched (usually mid-shin), then stand up by driving the hips forward."],
  },
  "b-stance-rdl": {
    feel: "Hamstring and glute of the front leg.",
    tips: ["About 80% of your weight on the front leg.", "Same hip hinge as a normal RDL: hips back, flat back.", "Back foot is only for balance."],
  },
  "barbell-hip-thrust": {
    feel: "Glutes. Hamstrings cramping means the feet are too far; quads burning means they're too close.",
    tips: ["Shins vertical at the top.", "Chin tucked and look forward, not up; ribs down.", "Finish by squeezing the glutes, not by arching the lower back.", "Use a pad or folded mat under the bar."],
  },
  "rope-pull-through": {
    feel: "Glutes and hamstrings.",
    tips: ["Hinge back with a flat back, knees soft.", "Stand up by squeezing the glutes hard.", "Arms just hold the rope; they don't pull."],
  },
  "single-leg-glute-bridge": {
    feel: "Glute and hamstring of the working leg.",
    tips: ["Push through the heel.", "Keep the hips level.", "Squeeze at the top for a second."],
  },
  "copenhagen-plank": {
    feel: "Inner thigh of the top leg, and the side of the stomach.",
    tips: ["Knee (not foot) on the bench to start.", "Body in a straight line from head to knee.", "Press the top knee down into the bench."],
  },
  "standing-hip-abduction": {
    feel: "Outer side of the hip.",
    tips: ["Toes point forward or slightly down.", "Don't lean the body sideways.", "Slow, controlled lift and lower."],
  },

  // Calves & shins
  "db-calf-raise": {
    feel: "Calves, especially a stretch at the bottom.",
    tips: ["Pause 1–2 seconds in the deep stretch at the bottom.", "Rise up onto the big toe, not the outside of the foot.", "No bouncing."],
  },
  "leg-press-calf-raise": {
    feel: "Calves.",
    tips: ["Balls of the feet on the edge, legs almost straight.", "Full stretch at the bottom, full rise at the top.", "Slow and controlled; feet must stay secure."],
  },
  "seated-calf-raise": {
    feel: "Lower, deeper calf (soleus).",
    tips: ["Deep stretch and pause at the bottom.", "Push through the big toe.", "Higher reps work well (12–20)."],
  },
  "tibialis-raise": {
    feel: "Front of the shins.",
    tips: ["Legs straight, back on the wall.", "Pull the toes up as high as possible.", "Further from the wall = harder."],
  },

  // Abs & core
  "rope-cable-crunch": {
    feel: "Abs. Hip flexors or arms doing the work means you're sitting back or pulling.",
    tips: ["Hips stay still above the knees.", "Curl the spine: ribs move toward the pelvis.", "Exhale fully at the bottom."],
  },
  "ab-wheel-rollout": {
    feel: "Abs, working hard to stop the back from arching.",
    tips: ["Tuck the pelvis slightly (squeeze the glutes).", "Roll out only as far as the lower back stays flat.", "Pull back with the abs, not the hips."],
  },
  "reverse-crunch": {
    feel: "Lower part of the abs.",
    tips: ["Curl the hips up off the floor; don't swing the legs.", "Lower slowly.", "Lower back stays in contact as you return."],
  },
  "rope-pallof-press": {
    feel: "Side of the stomach (obliques).",
    tips: ["Squeeze the glutes and brace.", "Press straight out and hold; don't let the cable turn you.", "Further from the machine = harder."],
  },
  "dead-bug": {
    feel: "Deep abs.",
    tips: ["Lower back pressed into the floor the whole time.", "Exhale as you extend.", "Slow beats fast."],
  },
  crunch: {
    feel: "Abs, not the neck.",
    tips: ["Curl the ribs toward the hips; the lower back stays down.", "Hands lightly at the temples; don't pull the head.", "Exhale on the way up."],
  },
  plank: {
    feel: "Abs and whole trunk.",
    tips: ["Squeeze the glutes and pull the elbows toward the toes (without moving).", "Ribs down, neutral neck.", "Short, high-quality holds beat long sagging ones."],
  },
};

export interface TechniqueTopic {
  title: string;
  points: string[];
}

/** General technique that applies across exercises, shown in the Exercises tab. */
export const TECHNIQUE_BASICS: TechniqueTopic[] = [
  {
    title: "Pressing (chest & shoulders)",
    points: [
      "Shoulder blades back and down before you start (\"back pockets\"), and keep them there. This protects the shoulder and puts the chest in a stronger position.",
      "A small arch in the upper back (chest up) is good. Keep the backside on the seat or bench, and don't crank the lower back.",
      "Elbows about 45–60° from your body, an arrow shape, not a T. Flaring to 90° shifts stress onto the front of the shoulder.",
      "Wrists stacked over the elbows; forearms roughly vertical at the bottom.",
    ],
  },
  {
    title: "Pulling (back)",
    points: [
      "Start each rep by moving the shoulder blade (down for pulldowns, back for rows), then bend the elbow.",
      "Pull with the elbows; the hands are just hooks. A thumbless grip can help you feel the back more than the arms.",
      "Let the arms fully stretch forward or up at the start of every rep.",
      "Don't shrug toward the ears.",
    ],
  },
  {
    title: "Arms (curls & triceps)",
    points: [
      "Upper arms stay still; only the forearms move. If the elbows swing, the weight is too heavy.",
      "Lower slowly (2–3 s). The lowering half builds muscle too.",
      "Stop any set that causes tingling, shock or pain around the elbow.",
    ],
  },
  {
    title: "Legs",
    points: [
      "Knees follow the line of the toes; don't let them cave inward.",
      "Hinges (RDLs, pull-throughs): hips go back, back stays flat, knees soft. Squats/presses: knees and hips bend together.",
      "Only go as deep as you can while the lower back stays in position.",
    ],
  },
  {
    title: "Every exercise",
    points: [
      "Control the weight: about 2–3 seconds down, then lift with intent. No bouncing.",
      "Use the full range you can control well; the stretched part of the movement matters a lot for growth.",
      "Brace before each rep: breathe in, tighten the stomach like you're about to be poked, then lift.",
      "Finish most sets with 1–3 good reps still in the tank. You don't need to go to failure.",
      "Think about the muscle you're training. Research shows focusing on the target muscle can increase its activity on isolation exercises.",
    ],
  },
];
