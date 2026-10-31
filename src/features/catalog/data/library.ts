const BAR = { weight: 20, increment: 2.5 };
const DUMBBELL = { weight: 8, increment: 2 };
const CABLE = { weight: 10, increment: 2.5 };
const MACHINE = { weight: 10, increment: 2.5 };
const BODYWEIGHT = { weight: 0, increment: 0 };

export const MUSCLES = [
  ['muscle-chest', 'Chest'],
  ['muscle-back', 'Back'],
  ['muscle-shoulders', 'Shoulders'],
  ['muscle-biceps', 'Biceps'],
  ['muscle-triceps', 'Triceps'],
  ['muscle-quads', 'Quads'],
  ['muscle-hamstrings', 'Hamstrings'],
  ['muscle-glutes', 'Glutes'],
  ['muscle-calves', 'Calves'],
  ['muscle-core', 'Core'],
  ['muscle-forearms', 'Forearms'],
  ['muscle-traps', 'Traps'],
] as const;

export const EQUIPMENT = [
  ['equip-barbell', 'Barbell'],
  ['equip-dumbbell', 'Dumbbell'],
  ['equip-machine', 'Machine'],
  ['equip-cable', 'Cable'],
  ['equip-bodyweight', 'Bodyweight'],
  ['equip-kettlebell', 'Kettlebell'],
] as const;

export const EXERCISES = [
  ['ex-squat', 'Back Squat', 'muscle-quads', 'equip-barbell'],
  ['ex-front-squat', 'Front Squat', 'muscle-quads', 'equip-barbell'],
  ['ex-goblet', 'Goblet Squat', 'muscle-quads', 'equip-kettlebell'],
  ['ex-split-squat', 'Bulgarian Split Squat', 'muscle-quads', 'equip-dumbbell'],
  ['ex-lunge', 'Walking Lunge', 'muscle-quads', 'equip-dumbbell'],
  ['ex-legpress', 'Leg Press', 'muscle-quads', 'equip-machine'],
  ['ex-hack', 'Hack Squat', 'muscle-quads', 'equip-machine'],
  ['ex-leg-extension', 'Leg Extension', 'muscle-quads', 'equip-machine'],
  ['ex-deadlift', 'Deadlift', 'muscle-back', 'equip-barbell'],
  ['ex-rdl', 'Romanian Deadlift', 'muscle-hamstrings', 'equip-barbell'],
  ['ex-good-morning', 'Good Morning', 'muscle-hamstrings', 'equip-barbell'],
  ['ex-leg-curl', 'Lying Leg Curl', 'muscle-hamstrings', 'equip-machine'],
  ['ex-seated-curl', 'Seated Leg Curl', 'muscle-hamstrings', 'equip-machine'],
  ['ex-nordic', 'Nordic Hamstring Curl', 'muscle-hamstrings', 'equip-bodyweight'],
  ['ex-hip-thrust', 'Hip Thrust', 'muscle-glutes', 'equip-barbell'],
  ['ex-glute-bridge', 'Glute Bridge', 'muscle-glutes', 'equip-bodyweight'],
  ['ex-pull-through', 'Cable Pull-Through', 'muscle-glutes', 'equip-cable'],
  ['ex-step-up', 'Step-Up', 'muscle-glutes', 'equip-dumbbell'],
  ['ex-calf', 'Standing Calf Raise', 'muscle-calves', 'equip-machine'],
  ['ex-seated-calf', 'Seated Calf Raise', 'muscle-calves', 'equip-machine'],
  ['ex-bench', 'Barbell Bench Press', 'muscle-chest', 'equip-barbell'],
  ['ex-incline-bench', 'Incline Barbell Bench Press', 'muscle-chest', 'equip-barbell'],
  ['ex-cgbp', 'Close-Grip Bench Press', 'muscle-triceps', 'equip-barbell'],
  ['ex-db-bench', 'Dumbbell Bench Press', 'muscle-chest', 'equip-dumbbell'],
  ['ex-incline-db', 'Incline Dumbbell Press', 'muscle-chest', 'equip-dumbbell'],
  ['ex-db-fly', 'Dumbbell Fly', 'muscle-chest', 'equip-dumbbell'],
  ['ex-cable-fly', 'Cable Fly', 'muscle-chest', 'equip-cable'],
  ['ex-pec-deck', 'Pec Deck', 'muscle-chest', 'equip-machine'],
  ['ex-machine-press', 'Machine Chest Press', 'muscle-chest', 'equip-machine'],
  ['ex-pushup', 'Push-Up', 'muscle-chest', 'equip-bodyweight'],
  ['ex-dip', 'Chest Dip', 'muscle-chest', 'equip-bodyweight'],
  ['ex-row', 'Barbell Row', 'muscle-back', 'equip-barbell'],
  ['ex-pendlay', 'Pendlay Row', 'muscle-back', 'equip-barbell'],
  ['ex-tbar', 'T-Bar Row', 'muscle-back', 'equip-barbell'],
  ['ex-db-row', 'Dumbbell Row', 'muscle-back', 'equip-dumbbell'],
  ['ex-cable-row', 'Seated Cable Row', 'muscle-back', 'equip-cable'],
  ['ex-pulldown', 'Lat Pulldown', 'muscle-back', 'equip-cable'],
  ['ex-straight-arm', 'Straight-Arm Pulldown', 'muscle-back', 'equip-cable'],
  ['ex-machine-row', 'Machine Row', 'muscle-back', 'equip-machine'],
  ['ex-pullup', 'Pull-Up', 'muscle-back', 'equip-bodyweight'],
  ['ex-chinup', 'Chin-Up', 'muscle-back', 'equip-bodyweight'],
  ['ex-ohp', 'Overhead Press', 'muscle-shoulders', 'equip-barbell'],
  ['ex-db-press', 'Dumbbell Shoulder Press', 'muscle-shoulders', 'equip-dumbbell'],
  ['ex-arnold', 'Arnold Press', 'muscle-shoulders', 'equip-dumbbell'],
  ['ex-lateral', 'Dumbbell Lateral Raise', 'muscle-shoulders', 'equip-dumbbell'],
  ['ex-cable-lateral', 'Cable Lateral Raise', 'muscle-shoulders', 'equip-cable'],
  ['ex-rear-delt', 'Rear Delt Fly', 'muscle-shoulders', 'equip-dumbbell'],
  ['ex-reverse-fly', 'Reverse Fly', 'muscle-shoulders', 'equip-machine'],
  ['ex-facepull', 'Face Pull', 'muscle-shoulders', 'equip-cable'],
  ['ex-machine-shoulder', 'Machine Shoulder Press', 'muscle-shoulders', 'equip-machine'],
  ['ex-curl', 'Dumbbell Curl', 'muscle-biceps', 'equip-dumbbell'],
  ['ex-bb-curl', 'Barbell Curl', 'muscle-biceps', 'equip-barbell'],
  ['ex-hammer', 'Hammer Curl', 'muscle-biceps', 'equip-dumbbell'],
  ['ex-incline-curl', 'Incline Dumbbell Curl', 'muscle-biceps', 'equip-dumbbell'],
  ['ex-cable-curl', 'Cable Curl', 'muscle-biceps', 'equip-cable'],
  ['ex-preacher', 'Preacher Curl', 'muscle-biceps', 'equip-barbell'],
  ['ex-extension', 'Dumbbell Triceps Extension', 'muscle-triceps', 'equip-dumbbell'],
  ['ex-pushdown', 'Cable Pushdown', 'muscle-triceps', 'equip-cable'],
  ['ex-skull', 'Skull Crusher', 'muscle-triceps', 'equip-barbell'],
  ['ex-oh-extension', 'Overhead Cable Extension', 'muscle-triceps', 'equip-cable'],
  ['ex-shrug', 'Barbell Shrug', 'muscle-traps', 'equip-barbell'],
  ['ex-db-shrug', 'Dumbbell Shrug', 'muscle-traps', 'equip-dumbbell'],
  ['ex-wrist', 'Wrist Curl', 'muscle-forearms', 'equip-barbell'],
  ['ex-reverse-curl', 'Reverse Curl', 'muscle-forearms', 'equip-barbell'],
  ['ex-leg-raise', 'Hanging Leg Raise', 'muscle-core', 'equip-bodyweight'],
  ['ex-cable-crunch', 'Cable Crunch', 'muscle-core', 'equip-cable'],
  ['ex-ab-wheel', 'Ab Wheel Rollout', 'muscle-core', 'equip-bodyweight'],
  ['ex-dead-bug', 'Dead Bug', 'muscle-core', 'equip-bodyweight'],
] as const;

type Load = { weight: number; increment: number };

export type SeedSlot = {
  exerciseId: string;
  sets: number;
  repMin: number;
  repMax: number;
  weight: number;
  increment: number;
};

export type SeedDay = {
  id: string;
  name: string;
  weekday: number | null;
  slots: SeedSlot[];
};

export type SeedProgram = {
  id: string;
  name: string;
  days: SeedDay[];
};

function slot(
  exerciseId: string,
  sets: number,
  repMin: number,
  repMax: number,
  load: Load,
): SeedSlot {
  return { exerciseId, sets, repMin, repMax, ...load };
}

function day(id: string, name: string, weekday: number | null, slots: SeedSlot[]): SeedDay {
  return { id, name, weekday, slots };
}

const push = [
  slot('ex-bench', 4, 5, 8, BAR),
  slot('ex-ohp', 3, 5, 8, BAR),
  slot('ex-lateral', 3, 8, 12, DUMBBELL),
  slot('ex-pushdown', 3, 8, 12, CABLE),
];

const pull = [
  slot('ex-row', 4, 5, 8, BAR),
  slot('ex-pulldown', 3, 8, 12, CABLE),
  slot('ex-facepull', 3, 8, 12, CABLE),
  slot('ex-curl', 3, 8, 12, DUMBBELL),
];

const legs = [
  slot('ex-squat', 4, 5, 8, BAR),
  slot('ex-rdl', 3, 5, 8, BAR),
  slot('ex-legpress', 3, 8, 12, MACHINE),
  slot('ex-calf', 3, 8, 12, MACHINE),
];

export const PROGRAMS: SeedProgram[] = [
  {
    id: 'split-full-body',
    name: 'Full Body',
    days: [
      day('day-fb-a', 'Full Body A', 1, [
        slot('ex-squat', 3, 5, 8, BAR),
        slot('ex-bench', 3, 5, 8, BAR),
        slot('ex-row', 3, 5, 8, BAR),
        slot('ex-curl', 2, 8, 12, DUMBBELL),
      ]),
      day('day-fb-b', 'Full Body B', 3, [
        slot('ex-deadlift', 3, 3, 5, BAR),
        slot('ex-ohp', 3, 5, 8, BAR),
        slot('ex-pullup', 3, 3, 8, BODYWEIGHT),
        slot('ex-lateral', 2, 8, 12, DUMBBELL),
      ]),
      day('day-fb-c', 'Full Body C', 5, [
        slot('ex-rdl', 3, 5, 8, BAR),
        slot('ex-bench', 3, 5, 8, BAR),
        slot('ex-pulldown', 3, 8, 12, CABLE),
        slot('ex-extension', 2, 8, 12, DUMBBELL),
      ]),
    ],
  },
  {
    id: 'split-upper-lower',
    name: 'Upper Lower',
    days: [
      day('day-ul-upper-a', 'Upper A', 1, [
        slot('ex-bench', 4, 5, 8, BAR),
        slot('ex-row', 4, 5, 8, BAR),
        slot('ex-ohp', 3, 6, 10, BAR),
        slot('ex-curl', 2, 8, 12, DUMBBELL),
      ]),
      day('day-ul-lower-a', 'Lower A', 2, [
        slot('ex-squat', 4, 5, 8, BAR),
        slot('ex-rdl', 3, 6, 10, BAR),
        slot('ex-legpress', 3, 8, 12, MACHINE),
        slot('ex-calf', 3, 8, 12, MACHINE),
      ]),
      day('day-ul-upper-b', 'Upper B', 4, [
        slot('ex-incline-db', 4, 6, 10, DUMBBELL),
        slot('ex-pulldown', 4, 8, 12, CABLE),
        slot('ex-lateral', 3, 10, 15, DUMBBELL),
        slot('ex-pushdown', 3, 8, 12, CABLE),
      ]),
      day('day-ul-lower-b', 'Lower B', 5, [
        slot('ex-deadlift', 3, 3, 5, BAR),
        slot('ex-split-squat', 3, 6, 10, DUMBBELL),
        slot('ex-leg-curl', 3, 8, 12, MACHINE),
        slot('ex-hip-thrust', 3, 6, 10, BAR),
      ]),
    ],
  },
  {
    id: 'split-ppl',
    name: 'Push Pull Legs',
    days: [
      day('day-ppl-push', 'Push', 1, push),
      day('day-ppl-pull', 'Pull', 3, pull),
      day('day-ppl-legs', 'Legs', 5, legs),
    ],
  },
  {
    id: 'split-ppl-custom',
    name: 'Push Pull Legs Custom',
    days: [
      day('day-ppl-custom-push', 'Push', null, [
        slot('ex-incline-db', 3, 10, 16, { weight: 15, increment: 2.5 }),
        slot('ex-db-bench', 3, 8, 11, { weight: 15, increment: 2.5 }),
        slot('ex-pec-deck', 3, 10, 14, { weight: 35, increment: 5 }),
        slot('ex-db-press', 3, 10, 13, { weight: 12.5, increment: 2.5 }),
        slot('ex-lateral', 3, 15, 22, { weight: 5, increment: 2.5 }),
        slot('ex-oh-extension', 3, 8, 15, { weight: 10, increment: 2.5 }),
        slot('ex-pushdown', 3, 12, 20, { weight: 15, increment: 5 }),
      ]),
      day('day-ppl-custom-pull', 'Pull', null, [
        slot('ex-pulldown', 4, 9, 15, { weight: 45, increment: 5 }),
        slot('ex-cable-row', 3, 12, 13, { weight: 40, increment: 5 }),
        slot('ex-reverse-fly', 3, 8, 14, { weight: 30, increment: 5 }),
        slot('ex-preacher', 3, 6, 12, { weight: 30, increment: 2.5 }),
        slot('ex-cable-curl', 3, 8, 13, { weight: 30, increment: 5 }),
        slot('ex-hammer', 3, 10, 17, { weight: 25, increment: 2.5 }),
      ]),
      day('day-ppl-custom-legs', 'Legs', null, [
        slot('ex-squat', 3, 13, 14, { weight: 45, increment: 2.5 }),
        slot('ex-leg-extension', 3, 10, 17, { weight: 30, increment: 5 }),
        slot('ex-leg-curl', 3, 10, 14, { weight: 15, increment: 5 }),
        slot('ex-calf', 3, 8, 12, { weight: 35, increment: 5 }),
        slot('ex-wrist', 3, 20, 30, { weight: 35, increment: 2.5 }),
        slot('ex-reverse-curl', 3, 15, 20, { weight: 5, increment: 2.5 }),
      ]),
    ],
  },
  {
    id: 'split-ppl-repeat',
    name: 'Push Pull Legs Repeat',
    days: [
      day('day-ppl6-push-a', 'Push', null, push),
      day('day-ppl6-pull-a', 'Pull', null, pull),
      day('day-ppl6-legs-a', 'Legs', null, legs),
      day('day-ppl6-push-b', 'Push', null, [
        slot('ex-incline-bench', 4, 6, 10, BAR),
        slot('ex-db-press', 3, 6, 10, DUMBBELL),
        slot('ex-cable-lateral', 3, 10, 15, CABLE),
        slot('ex-skull', 3, 6, 10, BAR),
      ]),
      day('day-ppl6-pull-b', 'Pull', null, [
        slot('ex-pullup', 4, 3, 8, BODYWEIGHT),
        slot('ex-cable-row', 3, 8, 12, CABLE),
        slot('ex-rear-delt', 3, 10, 15, DUMBBELL),
        slot('ex-hammer', 3, 8, 12, DUMBBELL),
      ]),
      day('day-ppl6-legs-b', 'Legs', null, [
        slot('ex-front-squat', 4, 5, 8, BAR),
        slot('ex-leg-curl', 3, 8, 12, MACHINE),
        slot('ex-lunge', 3, 8, 12, DUMBBELL),
        slot('ex-seated-calf', 3, 8, 12, MACHINE),
      ]),
    ],
  },
  {
    id: 'split-body-part',
    name: 'Body Part',
    days: [
      day('day-bp-chest', 'Chest', 1, [
        slot('ex-bench', 4, 5, 8, BAR),
        slot('ex-incline-db', 3, 8, 12, DUMBBELL),
        slot('ex-db-fly', 3, 10, 15, DUMBBELL),
        slot('ex-dip', 3, 6, 12, BODYWEIGHT),
      ]),
      day('day-bp-back', 'Back', 2, [
        slot('ex-deadlift', 3, 3, 5, BAR),
        slot('ex-pulldown', 4, 8, 12, CABLE),
        slot('ex-db-row', 3, 8, 12, DUMBBELL),
        slot('ex-facepull', 3, 12, 15, CABLE),
      ]),
      day('day-bp-shoulders', 'Shoulders', 3, [
        slot('ex-ohp', 4, 5, 8, BAR),
        slot('ex-lateral', 4, 10, 15, DUMBBELL),
        slot('ex-rear-delt', 3, 12, 15, DUMBBELL),
        slot('ex-shrug', 3, 8, 12, BAR),
      ]),
      day('day-bp-arms', 'Arms', 4, [
        slot('ex-bb-curl', 3, 8, 12, BAR),
        slot('ex-hammer', 3, 8, 12, DUMBBELL),
        slot('ex-pushdown', 3, 8, 12, CABLE),
        slot('ex-skull', 3, 6, 10, BAR),
      ]),
      day('day-bp-legs', 'Legs', 5, [
        slot('ex-squat', 4, 5, 8, BAR),
        slot('ex-rdl', 3, 6, 10, BAR),
        slot('ex-legpress', 3, 8, 12, MACHINE),
        slot('ex-calf', 4, 8, 12, MACHINE),
      ]),
    ],
  },
  {
    id: 'split-arnold',
    name: 'Arnold',
    days: [
      day('day-ar-chest-back', 'Chest and Back', 1, [
        slot('ex-bench', 4, 6, 10, BAR),
        slot('ex-row', 4, 6, 10, BAR),
        slot('ex-incline-db', 3, 8, 12, DUMBBELL),
        slot('ex-pulldown', 3, 8, 12, CABLE),
      ]),
      day('day-ar-shoulders-arms', 'Shoulders and Arms', 3, [
        slot('ex-ohp', 4, 6, 10, BAR),
        slot('ex-lateral', 3, 10, 15, DUMBBELL),
        slot('ex-curl', 3, 8, 12, DUMBBELL),
        slot('ex-pushdown', 3, 8, 12, CABLE),
      ]),
      day('day-ar-legs', 'Legs', 5, [
        slot('ex-squat', 4, 6, 10, BAR),
        slot('ex-rdl', 3, 6, 10, BAR),
        slot('ex-lunge', 3, 8, 12, DUMBBELL),
        slot('ex-calf', 4, 10, 15, MACHINE),
      ]),
    ],
  },
];
