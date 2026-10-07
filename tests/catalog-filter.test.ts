import { describe, expect, it } from "vitest";
import catalog from "@/data/exercise-catalog.json";
import { filterCatalog } from "@/lib/catalog/filter";

const names = (text: string, extra: { muscle?: string; equipment?: string } = {}) =>
  filterCatalog(catalog, { text, ...extra }).map((e) => e.name);

describe("exercise search", () => {
  it("matches every word in any order", () => {
    expect(names("barbell row")).toContain("Barbell bent over row");
    expect(names("row barbell")).toContain("Barbell bent over row");
    expect(names("barbell row").every((n) => /\bbarbell/i.test(n) && /\brow/i.test(n))).toBe(true);
    // "row" must start a word: it is not found inside "narrow".
    expect(names("barbell row")).not.toContain("Barbell narrow stance squat");
    // A word still matches by its beginning.
    expect(names("pull")).toEqual(expect.arrayContaining(["Pull-up", "Cable pulldown"]));
  });

  it("ignores case and punctuation", () => {
    expect(names("PULL UP")[0]).toBe("Pull-up");
    expect(names("pull-up")[0]).toBe("Pull-up");
    expect(names("3/4 sit up")).toContain("3/4 sit-up");
  });

  it("lists an exact name first, then names containing the phrase, in name order", () => {
    expect(names("bench press").slice(0, 3)).toContain("Barbell bench press");
    expect(names("barbell curl")[0]).toBe("Barbell curl");
    const rows = names("bent over row");
    expect(rows.indexOf("Barbell bent over row")).toBeLessThan(
      rows.indexOf("Barbell reverse grip bent over row"),
    );
  });

  it("puts names containing the phrase as typed ahead of scattered matches", () => {
    const results = names("press bench");
    const phrase = results.filter((n) => /press.*bench/i.test(n.replace(/[^a-z0-9]+/gi, " ")));
    expect(results.slice(0, phrase.length).sort()).toEqual(phrase.sort());
  });

  it("combines with the muscle and equipment filters", () => {
    const filtered = filterCatalog(catalog, { text: "row", equipment: "barbell", muscle: "back" });
    expect(filtered.map((e) => e.name)).toContain("Barbell bent over row");
    expect(filtered.every((e) => e.equipment === "barbell" && e.primaryMuscle === "back")).toBe(true);
  });

  it("keeps the given order when nothing is typed, and finds nothing for unknown words", () => {
    expect(names("")).toEqual(catalog.map((e) => e.name));
    expect(names("   ")).toHaveLength(catalog.length);
    expect(names("barbell zzzz")).toEqual([]);
  });
});
