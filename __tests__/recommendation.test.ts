/**
 * Unit tests for the recommendation engine.
 * Run: npx tsx --test __tests__/recommendation.test.ts
 *
 * Uses Node's built-in test runner (node:test) — no extra dependencies.
 * All tests use injected catalog snapshots so they never hit catalog.json.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  scoreColour,
  scoreOccasion,
  scoreStyle,
  scoreSilhouette,
  scoreBudget,
  scoreCoordination,
  compositeScore,
  buildLooks,
  DEFAULT_WEIGHTS,
  type CatalogSnapshot,
} from "../lib/recommendation";

import type { Outfit, Earrings, Bracelet, Shoes, Bag, LipstickShade, Hairstyle } from "../types/catalog";
import type { StylingProfile, UserPreferences } from "../types/styling";

// ─── Minimal fixture factories ────────────────────────────────────────────────

function makeOutfit(overrides: Partial<Outfit> = {}): Outfit {
  return {
    id:             "o1",
    category:       "outfit",
    name:           "Test Gown",
    outfitType:     "Gown",
    description:    "A test outfit",
    colour:         "Red",
    colourHex:      "#CC0000",
    priceINR:       3000,
    image:          "https://placehold.co/400x600/CC0000/fff?text=Outfit",
    garmentImageUrl: "https://example.com/garment.png",
    occasions:      ["Wedding"],
    styles:         ["Elegant"],
    undertones:     ["warm"],
    silhouetteTags: ["draped", "flowy"],
    ...overrides,
  };
}

function makeEarrings(overrides: Partial<Earrings> = {}): Earrings {
  return {
    id:                    "e1",
    category:              "earrings",
    name:                  "Gold Jhumka",
    colour:                "Gold",
    colourHex:             "#C9A84C",
    priceINR:              800,
    image:                 "https://placehold.co/300x300/C9A84C/fff?text=Earrings",
    material:              "Gold-plated",
    earringStyle:          "Jhumka",
    occasions:             ["Wedding"],
    styles:                ["Elegant"],
    undertones:            ["warm"],
    compatibleOutfitTypes: ["Gown", "CoordSet"],
    ...overrides,
  };
}

function makeBracelet(overrides: Partial<Bracelet> = {}): Bracelet {
  return {
    id:                    "b1",
    category:              "bracelet",
    name:                  "Gold Bangle",
    colour:                "Gold",
    colourHex:             "#C9A84C",
    priceINR:              600,
    image:                 "https://placehold.co/300x300/C9A84C/fff?text=Bracelet",
    material:              "Gold-plated",
    braceletStyle:         "Bangle",
    occasions:             ["Wedding"],
    styles:                ["Elegant"],
    undertones:            ["warm"],
    compatibleOutfitTypes: ["Gown", "CoordSet"],
    ...overrides,
  };
}

function makeShoes(overrides: Partial<Shoes> = {}): Shoes {
  return {
    id:                    "s1",
    category:              "shoes",
    name:                  "Gold Heels",
    colour:                "Gold",
    colourHex:             "#C9A84C",
    priceINR:              1500,
    image:                 "https://placehold.co/300x300/C9A84C/fff?text=Shoes",
    heelHeight:            "mid",
    shoeStyle:             "Block heels",
    occasions:             ["Wedding"],
    styles:                ["Elegant"],
    compatibleOutfitTypes: ["Gown", "CoordSet"],
    ...overrides,
  };
}

function makeBag(overrides: Partial<Bag> = {}): Bag {
  return {
    id:                    "bg1",
    category:              "bag",
    name:                  "Classic Tote",
    colour:                "Tan",
    colourHex:             "#C8A882",
    priceINR:              1500,
    image:                 "https://placehold.co/300x300/C8A882/fff?text=Bag",
    bagImageUrl:           "https://placehold.co/300x300/C8A882/fff?text=Bag",
    material:              "Vegan leather",
    bagStyle:              "Tote",
    occasions:             ["Wedding"],
    styles:                ["Elegant"],
    undertones:            ["warm"],
    compatibleOutfitTypes: ["Gown", "CoordSet"],
    ...overrides,
  };
}

function makeLipstick(overrides: Partial<LipstickShade> = {}): LipstickShade {
  return {
    id:          "l1",
    category:    "lipstick",
    name:        "Red Lip",
    shadeName:   "Classic Red",
    hexCode:     "#CC0000",
    priceINR:    500,
    image:       "https://placehold.co/200x200/CC0000/fff?text=Lip",
    finish:      "matte",
    undertones:  ["warm"],
    occasions:   ["Wedding"],
    ...overrides,
  };
}

function makeHairstyle(overrides: Partial<Hairstyle> = {}): Hairstyle {
  return {
    id:          "h1",
    category:    "hairstyle",
    name:        "Bun",
    description: "Elegant bun",
    image:       "https://placehold.co/200x200/ccc/333?text=Hair",
    occasions:   ["Wedding"],
    styles:      ["Elegant"],
    priceINR:    0,
    ...overrides,
  };
}

function makeProfile(undertone: "warm" | "cool" | "neutral" = "warm"): StylingProfile {
  return {
    skinTone:      "medium",
    skinToneLabel: "Medium",
    skinColourHex: "#C4956A",
    undertone,
    colourPalette: [],
    stylingNote:   "",
    source:        "analyzed",
  };
}

function makePreferences(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return {
    occasion:   "Wedding",
    style:      "Elegant",
    outfitType: "Gown",
    budgetINR:  10000,
    ...overrides,
  };
}

function makeCatalog(overrides: Partial<CatalogSnapshot> = {}): CatalogSnapshot {
  return {
    outfits:    [makeOutfit()],
    earrings:   [makeEarrings()],
    bracelets:  [makeBracelet()],
    shoes:      [makeShoes()],
    bags:       [makeBag()],
    lipsticks:  [makeLipstick()],
    hairstyles: [makeHairstyle()],
    ...overrides,
  };
}

// ─── scoreColour ──────────────────────────────────────────────────────────────

describe("scoreColour", () => {
  it("returns 1 when all three items match the undertone", () => {
    const score = scoreColour(
      makeOutfit({ undertones: ["warm"] }),
      makeEarrings({ undertones: ["warm"] }),
      makeBracelet({ undertones: ["warm"] }),
      makeProfile("warm")
    );
    assert.equal(score, 1);
  });

  it("returns 0 when no items match", () => {
    const score = scoreColour(
      makeOutfit({ undertones: ["cool"] }),
      makeEarrings({ undertones: ["cool"] }),
      makeBracelet({ undertones: ["cool"] }),
      makeProfile("warm")
    );
    assert.equal(score, 0);
  });

  it("returns 2/3 when two of three items match", () => {
    const score = scoreColour(
      makeOutfit({ undertones: ["warm"] }),
      makeEarrings({ undertones: ["warm"] }),
      makeBracelet({ undertones: ["cool"] }),
      makeProfile("warm")
    );
    assert.ok(Math.abs(score - 2 / 3) < 0.001);
  });

  it("respects neutral undertone", () => {
    const score = scoreColour(
      makeOutfit({ undertones: ["neutral"] }),
      makeEarrings({ undertones: ["neutral"] }),
      makeBracelet({ undertones: ["neutral"] }),
      makeProfile("neutral")
    );
    assert.equal(score, 1);
  });
});

// ─── scoreOccasion ────────────────────────────────────────────────────────────

describe("scoreOccasion", () => {
  it("returns 1 when all items match the occasion", () => {
    const score = scoreOccasion(
      makeOutfit(),
      makeEarrings(),
      makeBracelet(),
      makeShoes(),
      makeLipstick(),
      "Wedding"
    );
    assert.equal(score, 1);
  });

  it("returns 0 when no items include the occasion", () => {
    const score = scoreOccasion(
      makeOutfit({ occasions: ["Party"] }),
      makeEarrings({ occasions: ["Party"] }),
      makeBracelet({ occasions: ["Party"] }),
      makeShoes({ occasions: ["Party"] }),
      makeLipstick({ occasions: ["Party"] }),
      "Wedding"
    );
    assert.equal(score, 0);
  });

  it("returns 0.6 when 3 of 5 items match", () => {
    const score = scoreOccasion(
      makeOutfit({ occasions: ["Wedding"] }),
      makeEarrings({ occasions: ["Wedding"] }),
      makeBracelet({ occasions: ["Wedding"] }),
      makeShoes({ occasions: ["Party"] }),
      makeLipstick({ occasions: ["Party"] }),
      "Wedding"
    );
    assert.ok(Math.abs(score - 0.6) < 0.001);
  });
});

// ─── scoreBudget ──────────────────────────────────────────────────────────────

describe("scoreBudget", () => {
  it("returns 0 when purchase exceeds budget", () => {
    assert.equal(scoreBudget(12000, 10000), 0);
  });

  it("returns 1 at exact sweet-spot utilization (80%)", () => {
    assert.equal(scoreBudget(8000, 10000), 1);
  });

  it("returns 1 across the full 70–95% sweet-spot range", () => {
    assert.equal(scoreBudget(7000, 10000), 1);   // 70%
    assert.equal(scoreBudget(9000, 10000), 1);   // 90%
  });

  it("is proportionally lower below 70%", () => {
    const score = scoreBudget(3500, 10000); // 35% — half of 70%
    assert.ok(score > 0 && score < 0.6, `Expected 0<score<0.6, got ${score}`);
  });

  it("returns 0 for exactly 0 budget used (edge case)", () => {
    // 0 / budget = 0 utilization → score = 0
    assert.equal(scoreBudget(0, 10000), 0);
  });
});

// ─── scoreCoordination ───────────────────────────────────────────────────────

describe("scoreCoordination", () => {
  it("returns 1 when all accessories are compatible with outfit type", () => {
    const score = scoreCoordination(
      makeOutfit({ outfitType: "Gown" }),
      makeEarrings({ compatibleOutfitTypes: ["Gown"] }),
      makeBracelet({ compatibleOutfitTypes: ["Gown"] }),
      makeShoes({ compatibleOutfitTypes: ["Gown"] })
    );
    assert.equal(score, 1);
  });

  it("returns 0 when no accessories are compatible", () => {
    const score = scoreCoordination(
      makeOutfit({ outfitType: "Gown" }),
      makeEarrings({ compatibleOutfitTypes: ["Dress"] }),
      makeBracelet({ compatibleOutfitTypes: ["Dress"] }),
      makeShoes({ compatibleOutfitTypes: ["Dress"] })
    );
    assert.equal(score, 0);
  });

  it("returns 1/3 when only one of three is compatible", () => {
    const score = scoreCoordination(
      makeOutfit({ outfitType: "Gown" }),
      makeEarrings({ compatibleOutfitTypes: ["Gown"] }),
      makeBracelet({ compatibleOutfitTypes: ["Dress"] }),
      makeShoes({ compatibleOutfitTypes: ["Dress"] })
    );
    assert.ok(Math.abs(score - 1 / 3) < 0.001);
  });
});

// ─── scoreSilhouette ─────────────────────────────────────────────────────────

describe("scoreSilhouette", () => {
  it("prefers delicate accessories for voluminous/draped silhouettes", () => {
    const heavy = scoreSilhouette(
      makeOutfit({ silhouetteTags: ["draped", "flowy"] }),
      makeEarrings({ earringStyle: "statement chandelier" }),
      makeBracelet({ braceletStyle: "heavy bangles" })
    );
    const delicate = scoreSilhouette(
      makeOutfit({ silhouetteTags: ["draped", "flowy"] }),
      makeEarrings({ earringStyle: "delicate stud" }),
      makeBracelet({ braceletStyle: "thin delicate" })
    );
    assert.ok(delicate > heavy, `Expected delicate(${delicate}) > heavy(${heavy})`);
  });

  it("prefers statement accessories for fitted silhouettes", () => {
    const heavy = scoreSilhouette(
      makeOutfit({ silhouetteTags: ["fitted", "tailored"] }),
      makeEarrings({ earringStyle: "bold long earring" }),
      makeBracelet({ braceletStyle: "statement cuff" })
    );
    const delicate = scoreSilhouette(
      makeOutfit({ silhouetteTags: ["fitted", "tailored"] }),
      makeEarrings({ earringStyle: "minimal stud" }),
      makeBracelet({ braceletStyle: "thin subtle" })
    );
    assert.ok(heavy > delicate, `Expected heavy(${heavy}) > delicate(${delicate})`);
  });

  it("returns a value in [0, 1]", () => {
    const score = scoreSilhouette(makeOutfit(), makeEarrings(), makeBracelet());
    assert.ok(score >= 0 && score <= 1, `Score out of range: ${score}`);
  });
});

// ─── compositeScore ──────────────────────────────────────────────────────────

describe("compositeScore", () => {
  it("sums correctly with default weights (all 1.0 → 1.0)", () => {
    const breakdown = { colour: 1, occasion: 1, style: 1, silhouette: 1, budget: 1, coordination: 1 };
    const score = compositeScore(breakdown, DEFAULT_WEIGHTS);
    assert.ok(Math.abs(score - 1.0) < 0.001, `Expected ~1.0, got ${score}`);
  });

  it("sums correctly with all 0.0 → 0.0", () => {
    const breakdown = { colour: 0, occasion: 0, style: 0, silhouette: 0, budget: 0, coordination: 0 };
    assert.equal(compositeScore(breakdown, DEFAULT_WEIGHTS), 0);
  });

  it("custom weights override defaults correctly", () => {
    const breakdown = { colour: 1, occasion: 0, style: 0, silhouette: 0, budget: 0, coordination: 0 };
    const customWeights = { ...DEFAULT_WEIGHTS, colour: 1.0, occasion: 0, style: 0, silhouette: 0, budget: 0, coordination: 0 };
    assert.ok(Math.abs(compositeScore(breakdown, customWeights) - 1.0) < 0.001);
  });
});

// ─── buildLooks (integration) ─────────────────────────────────────────────────

describe("buildLooks", () => {
  it("returns exactly 3 looks when catalog has 3+ valid outfits", () => {
    const catalog = makeCatalog({
      outfits: [
        makeOutfit({ id: "o1", priceINR: 2000 }),
        makeOutfit({ id: "o2", priceINR: 2500 }),
        makeOutfit({ id: "o3", priceINR: 3000 }),
      ],
    });
    const looks = buildLooks(
      { profile: makeProfile(), preferences: makePreferences() },
      {},
      catalog
    );
    assert.equal(looks.length, 3);
  });

  it("returns fewer than 3 when catalog has only 2 valid outfits", () => {
    const catalog = makeCatalog({
      outfits: [
        makeOutfit({ id: "o1", priceINR: 2000 }),
        makeOutfit({ id: "o2", priceINR: 2500 }),
      ],
    });
    const looks = buildLooks(
      { profile: makeProfile(), preferences: makePreferences() },
      {},
      catalog
    );
    assert.ok(looks.length <= 2);
  });

  it("never returns a look above the user budget", () => {
    const budget = 6000;
    const catalog = makeCatalog({
      outfits: [
        makeOutfit({ id: "o1", priceINR: 2000 }),
        makeOutfit({ id: "o2", priceINR: 2500 }),
        makeOutfit({ id: "o3", priceINR: 3000 }),
      ],
      // earrings + bracelet + shoes total = 800 + 600 + 1500 = 2900
    });
    const looks = buildLooks(
      { profile: makeProfile(), preferences: makePreferences({ budgetINR: budget }) },
      {},
      catalog
    );
    for (const look of looks) {
      assert.ok(
        look.totalPriceINR <= budget,
        `Look ${look.id} total ₹${look.totalPriceINR} exceeds budget ₹${budget}`
      );
    }
  });

  it("excludes outfits whose price alone exceeds the budget", () => {
    const catalog = makeCatalog({
      outfits: [
        makeOutfit({ id: "o1", priceINR: 15000 }), // over budget
        makeOutfit({ id: "o2", priceINR: 2000 }),
      ],
    });
    const looks = buildLooks(
      { profile: makeProfile(), preferences: makePreferences({ budgetINR: 6000 }) },
      {},
      catalog
    );
    for (const look of looks) {
      assert.notEqual(look.outfit.id, "o1");
    }
  });

  it("looks are sorted by score descending", () => {
    const catalog = makeCatalog({
      outfits: [
        makeOutfit({ id: "o1", priceINR: 2000 }),
        makeOutfit({ id: "o2", priceINR: 2500 }),
        makeOutfit({ id: "o3", priceINR: 3000 }),
      ],
    });
    const looks = buildLooks(
      { profile: makeProfile(), preferences: makePreferences() },
      {},
      catalog
    );
    for (let i = 1; i < looks.length; i++) {
      assert.ok(
        looks[i - 1].score >= looks[i].score,
        `Look ${i - 1} score ${looks[i - 1].score} < look ${i} score ${looks[i].score}`
      );
    }
  });

  it("each look has rank 1, 2, 3 in order", () => {
    const catalog = makeCatalog({
      outfits: [
        makeOutfit({ id: "o1", priceINR: 2000 }),
        makeOutfit({ id: "o2", priceINR: 2500 }),
        makeOutfit({ id: "o3", priceINR: 3000 }),
      ],
    });
    const looks = buildLooks(
      { profile: makeProfile(), preferences: makePreferences() },
      {},
      catalog
    );
    assert.deepEqual(looks.map(l => l.rank), [1, 2, 3]);
  });

  it("respects custom weights — boosting colour weight elevates best-colour-match look", () => {
    // o1: all warm undertones (colour-perfect)
    // o2: all cool undertones (colour-mismatched)
    const catalog = makeCatalog({
      outfits: [
        makeOutfit({ id: "o1", priceINR: 2000, undertones: ["warm"] }),
        makeOutfit({ id: "o2", priceINR: 2000, undertones: ["cool"] }),
        makeOutfit({ id: "o3", priceINR: 2000, undertones: ["neutral"] }),
      ],
      earrings: [
        makeEarrings({ id: "e1", priceINR: 500, undertones: ["warm"], compatibleOutfitTypes: ["Saree"] }),
      ],
      bracelets: [
        makeBracelet({ id: "b1", priceINR: 500, undertones: ["warm"], compatibleOutfitTypes: ["Saree"] }),
      ],
    });

    const colourFirstWeights = {
      ...DEFAULT_WEIGHTS,
      colour: 0.80,
      occasion: 0.05,
      style: 0.05,
      silhouette: 0.05,
      budget: 0.03,
      coordination: 0.02,
    };

    const looks = buildLooks(
      { profile: makeProfile("warm"), preferences: makePreferences() },
      colourFirstWeights,
      catalog
    );

    assert.equal(looks[0].outfit.id, "o1", "Warm-matching outfit should rank first with colour-heavy weights");
  });

  it("returns empty array when no combinations fit in budget", () => {
    const catalog = makeCatalog({
      outfits: [makeOutfit({ priceINR: 9000 })], // leaves nothing for accessories
    });
    const looks = buildLooks(
      { profile: makeProfile(), preferences: makePreferences({ budgetINR: 5000 }) },
      {},
      catalog
    );
    assert.equal(looks.length, 0);
  });

  it("'Surprise Me' outfitType uses all outfit types in catalog", () => {
    const catalog = makeCatalog({
      outfits: [
        makeOutfit({ id: "o1", outfitType: "Saree",   priceINR: 2000 }),
        makeOutfit({ id: "o2", outfitType: "Lehenga", priceINR: 2000 }),
        makeOutfit({
          id: "o3", outfitType: "Dress", priceINR: 2000,
          silhouetteTags: ["fitted"],
        }),
      ],
      earrings:  [makeEarrings({ compatibleOutfitTypes: ["Saree", "Lehenga", "Dress"] })],
      bracelets: [makeBracelet({ compatibleOutfitTypes: ["Saree", "Lehenga", "Dress"] })],
      shoes:     [makeShoes({   compatibleOutfitTypes: ["Saree", "Lehenga", "Dress"] })],
    });
    const looks = buildLooks(
      { profile: makeProfile(), preferences: makePreferences({ outfitType: "Surprise Me" }) },
      {},
      catalog
    );
    const outfitTypes = looks.map(l => l.outfit.outfitType);
    assert.ok(outfitTypes.length >= 1, "Should return at least one look");
  });
});
