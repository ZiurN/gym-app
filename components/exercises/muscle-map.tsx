import { useId } from "react";
import type { MuscleRegion } from "@/lib/catalog/muscle-map";

// A stylised figure drawn for this project. Every path is the left half of
// the body in a 200-wide box; the right half is the same path mirrored.
const BODY_HALF =
  "M100 60 L91 60 C91 68 88 72 80 75 C68 78 56 80 50 90 C45 98 45 108 44 118 C42 134 40 148 39 162 C37 178 33 196 31 214 C30 222 29 228 28 234 C26 242 25 250 28 256 C32 260 38 256 40 248 C42 240 43 232 44 226 C48 208 53 190 56 172 C58 158 60 142 63 128 C64 142 66 158 67 172 C66 186 62 198 60 212 C57 232 56 252 58 272 C59 290 62 300 63 312 C62 326 59 340 60 356 C61 376 66 394 68 410 C66 418 60 424 60 430 C62 434 78 434 82 430 C82 422 80 416 81 410 C84 392 87 372 87 352 C87 338 85 326 86 314 C88 296 92 270 95 248 C96 238 98 230 100 224 Z";

/** Lower leg seen from the front: drawn for completeness, never highlighted. */
const FRONT_SHIN =
  "M64 318 C68 314 78 314 84 318 C85 340 83 362 80 386 C76 390 72 390 69 386 C64 364 62 340 64 318 Z";

const FRONT: Partial<Record<MuscleRegion, string>> = {
  neck:
    "M93 58 L100 58 L100 72 L92 70 Z",
  traps:
    "M90 64 C86 70 76 74 66 77 L80 80 L92 74 Z",
  shoulders:
    "M64 78 C54 80 47 88 46 100 C46 108 48 114 51 118 C56 110 62 100 66 90 C67 86 66 82 64 78 Z",
  chest:
    "M68 82 C76 80 90 80 99 84 L99 112 C92 118 80 120 70 114 C66 108 64 98 66 90 Z",
  biceps:
    "M50 120 C46 132 44 146 44 158 C48 162 54 160 56 154 C59 142 60 130 60 120 C58 114 54 114 50 120 Z",
  forearms:
    "M41 164 C37 180 34 198 32 216 C32 222 36 226 41 224 C46 208 51 190 54 172 C54 164 46 160 41 164 Z",
  abs:
    "M88 118 L99 116 L99 200 C94 200 88 196 86 188 C84 166 85 140 88 118 Z",
  obliques:
    "M70 118 C74 122 82 122 86 120 C83 144 83 168 85 190 C78 188 70 180 68 172 C67 154 67 136 70 118 Z",
  "hip-flexors":
    "M70 196 C76 204 86 210 97 212 L97 221 C86 220 74 214 65 206 Z",
  quads:
    "M61 214 C58 236 57 258 60 280 C62 296 66 304 72 308 C80 306 86 296 88 280 C90 262 90 244 88 228 C80 226 70 222 61 214 Z",
  adductors:
    "M90 228 C92 244 92 262 90 280 C92 270 95 250 97 232 C98 228 99 226 99 224 Z",
  abductors:
    "M61 198 C58 206 57 216 58 228 C60 222 62 216 64 210 C64 206 63 202 61 198 Z",
};

const BACK: Partial<Record<MuscleRegion, string>> = {
  neck:
    "M93 56 L100 56 L100 62 L93 63 Z",
  traps:
    "M100 60 L92 62 C88 70 78 75 66 78 C78 82 90 88 100 104 Z",
  "rear-shoulders":
    "M64 78 C54 80 47 88 46 100 C46 108 48 114 51 118 C56 110 62 100 66 90 C67 86 66 82 64 78 Z",
  "upper-back":
    "M66 86 C76 86 88 90 99 108 L99 124 C88 124 76 120 70 114 C67 106 66 96 66 86 Z",
  lats:
    "M64 118 C72 124 86 128 99 128 L99 166 C90 164 78 152 68 140 C65 132 64 124 64 118 Z",
  "lower-back":
    "M88 160 L99 164 L99 204 L84 198 C84 184 85 172 88 160 Z",
  triceps:
    "M50 120 C46 132 44 146 44 158 C48 162 54 160 56 154 C59 142 60 130 60 120 C58 114 54 114 50 120 Z",
  forearms:
    "M41 164 C37 180 34 198 32 216 C32 222 36 226 41 224 C46 208 51 190 54 172 C54 164 46 160 41 164 Z",
  glutes:
    "M62 206 C70 200 86 200 99 206 L99 240 C90 248 74 248 62 240 C58 228 59 214 62 206 Z",
  hamstrings:
    "M60 246 C70 252 86 252 94 246 C93 268 90 290 86 308 C80 312 70 312 64 308 C60 290 58 268 60 246 Z",
  calves:
    "M62 318 C68 314 80 314 86 318 C88 336 86 356 82 376 C78 382 70 382 66 376 C61 356 60 336 62 318 Z",
};

type MuscleMapProps = {
  target: MuscleRegion[];
  secondary: MuscleRegion[];
  /** Read out in place of the drawing. */
  label: string;
};

/**
 * Front and back figure with the target muscles filled solid and the
 * secondary ones hatched, so the two differ by more than color.
 */
export function MuscleMap({ target, secondary, label }: MuscleMapProps) {
  const hatch = useId();

  const half = (regions: Partial<Record<MuscleRegion, string>>, shin: boolean) => (
    <>
      <path d={BODY_HALF} className="fill-border" />
      {shin ? <path d={FRONT_SHIN} className="fill-muted stroke-background" /> : null}
      {(Object.entries(regions) as [MuscleRegion, string][]).map(([region, d]) => {
        const level = target.includes(region)
          ? "target"
          : secondary.includes(region)
            ? "secondary"
            : "none";
        return (
          <path
            key={region}
            d={d}
            data-region={region}
            data-level={level}
            className={
              level === "target"
                ? "fill-primary stroke-background"
                : level === "secondary"
                  ? "stroke-background"
                  : "fill-muted stroke-background"
            }
            fill={level === "secondary" ? `url(#${hatch})` : undefined}
          />
        );
      })}
    </>
  );

  const figure = (
    regions: Partial<Record<MuscleRegion, string>>,
    title: string,
    dx: number,
    shin: boolean,
  ) => (
    <g transform={`translate(${dx} 0)`} strokeWidth={1}>
      <ellipse cx={100} cy={34} rx={18} ry={23} className="fill-border" />
      {half(regions, shin)}
      <g transform="translate(200 0) scale(-1 1)">{half(regions, shin)}</g>
      <text x={100} y={449} textAnchor="middle" className="fill-muted-foreground text-[11px]">
        {title}
      </text>
    </g>
  );

  return (
    <svg viewBox="0 0 400 454" role="img" aria-label={label} className="w-full max-w-xs">
      <defs>
        <pattern id={hatch} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="5" height="5" className="fill-primary/25" />
          <rect width="2" height="5" className="fill-primary" />
        </pattern>
      </defs>
      {figure(FRONT, "Front", 0, true)}
      {figure(BACK, "Back", 200, false)}
    </svg>
  );
}

/** The two fills, for the legend next to the map. */
export function MuscleMapSwatch({ level }: { level: "target" | "secondary" }) {
  const hatch = useId();
  return (
    <svg viewBox="0 0 14 14" aria-hidden="true" className="inline-block size-3.5 align-[-2px]">
      <defs>
        <pattern id={hatch} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="5" height="5" className="fill-primary/25" />
          <rect width="2" height="5" className="fill-primary" />
        </pattern>
      </defs>
      <rect
        x="1"
        y="1"
        width="12"
        height="12"
        rx="3"
        className={level === "target" ? "fill-primary stroke-primary" : "stroke-primary"}
        fill={level === "secondary" ? `url(#${hatch})` : undefined}
      />
    </svg>
  );
}
