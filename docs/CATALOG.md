# Exercise catalog

The catalog is the shared, read-only list of exercises users pick from when
building routines, with the information shown about each one. Users cannot add
to it.

## Sources

| What | Source | Revision | Licence |
|---|---|---|---|
| Names, muscles, equipment, execution steps | [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) | `7455efae41b330c265e7cd4b78dfa848e7ce5ebd` | MIT (text and data only) |
| Start and end photos | [yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db) | `f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5` | Unlicense |

The first dataset's images and GIFs belong to Gym visual and are **not** covered
by its licence. Never import them. The import script drops those fields and
`npm test` fails if any trace of them reaches the generated files.

Licence texts and caveats are in [`THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md).

## Files

| File | Contents | Edited by |
|---|---|---|
| `data/exercise-catalog.json` | One entry per exercise | The import script |
| `data/exercise-instructions.en.json` | English steps, by slug | The import script |
| `data/exercise-modality-overrides.json` | Corrections to how an exercise is logged, by source id | Hand |
| `data/exercise-photo-map.json` | Source id -> free-exercise-db id | Hand, after review |
| `public/exercise-photos/<slug>/start.webp`, `end.webp` | The photos | The photo script |

Catalog entry fields:

| Field | Meaning |
|---|---|
| `sourceId` | Id in the source dataset. Re-imports match on it. |
| `slug` | Permanent identifier used in URLs and history. Never changes once assigned. |
| `name` | Display name. |
| `modality` | How sets are logged: `load_reps`, `time` or `per_side`. |
| `primaryMuscle`, `equipment` | The groups the picker filters by (`lib/catalog/types.ts`). |
| `targetMuscle`, `secondaryMuscles`, `equipmentDetail` | The source's specific values, shown on the exercise page. |

## Regenerate the catalog

Download the dataset file at the revision above (it is not committed; it is
17 MB and mostly other languages and media references):

    mkdir -p .dataset-cache
    curl -o .dataset-cache/exercises-dataset.json \
      https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/7455efae41b330c265e7cd4b78dfa848e7ce5ebd/data/exercises.json
    npm run import:exercises -- .dataset-cache/exercises-dataset.json
    npm test

Run unchanged, this reproduces the committed files exactly. To move to a newer
revision, change the hash here and in `THIRD_PARTY_NOTICES.md`, re-run, and
review the diff. Exercises keep their slug across re-imports even if renamed
upstream. The import stops on a muscle or equipment value it has no mapping
for; add it in `scripts/lib/import-exercises.mjs`.

### How an exercise is logged

The source does not say, so the import decides: cardio exercises and names
with a hold-type word (plank, hold, hang, stretch, carry, walk, run) are
`time`; names marking one limb (one arm, single leg) are `per_side`; the rest
are `load_reps`. When a rule gets one wrong, add its source id to
`data/exercise-modality-overrides.json`, re-run the import and update the
counts in `tests/catalog-seed.test.ts`. Sets already logged keep the modality
they were logged with.

## Load it into a database

    npm run db:seed-catalog

It upserts by slug, writes the instructions and the photo flags, and removes
exercises that are no longer in the seed: deleted when nothing references them,
retired when a routine, a logged set or a unit preference does. It is safe to
repeat.

## Retire an exercise

Retiring hides an exercise from the picker. Routines, logged sets and progress
that already use it keep working and still show its name and information.

    node scripts/catalog.mjs retire <slug>
    node scripts/catalog.mjs unretire <slug>

## Photos

Only exercises listed in `data/exercise-photo-map.json` have photos. To add
some:

    curl -o .dataset-cache/free-exercise-db.json \
      https://raw.githubusercontent.com/yuhonas/free-exercise-db/f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/dist/exercises.json
    node scripts/photos.mjs propose .dataset-cache/free-exercise-db.json

That prints name matches not yet mapped. A wrong photo next to execution steps
is worse than none, so look at each proposal before adding it to the mapping
file; exercises whose names differ between the two sources are added by hand
the same way. Then download and resize the photos and reseed:

    node scripts/photos.mjs fetch .dataset-cache/free-exercise-db.json f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5
    npm test
    npm run db:seed-catalog

### Remove all photos

    rm -r public/exercise-photos
    echo '{}' > data/exercise-photo-map.json
    npm run db:seed-catalog

and delete the two photo tests in `tests/exercise-details.test.ts` that expect
the folder. No exercise is then marked as having photos.

## Remove the instructions

Empty `data/exercise-instructions.en.json` to `{}`, delete the rows of the
`exercise_instruction` table, and reseed. The exercise page then shows the
muscle map and attributes without steps.
