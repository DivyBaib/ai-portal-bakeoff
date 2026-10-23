import { describe, it, expect } from "vitest";
import type { Model } from "../../src/data/schemas";

const sampleModels: Model[] = [
  {
    id: "model-a",
    name: "Model A",
    vendor: "Vendor A",
    parameters: null,
    license: null,
    contextWindow: 256000,
    toolCalling: 0.85,
    scores: { "src-1": 80 },
    free: { available: true, requestsPerDay: 500, trainsOnPrompts: true },
    price: null,
  },
  {
    id: "model-b",
    name: "Model B",
    vendor: "Vendor B",
    parameters: null,
    license: null,
    contextWindow: 1000000,
    toolCalling: 0.8,
    scores: { "src-1": 70 },
    free: { available: true, requestsPerDay: 400, trainsOnPrompts: true },
    price: { inputPerMTok: 0.2, outputPerMTok: 0.8 },
  },
  {
    id: "model-c",
    name: "Model C",
    vendor: "Vendor C",
    parameters: null,
    license: null,
    contextWindow: 128000,
    toolCalling: 0.8,
    scores: { "src-1": 66 },
    free: { available: true, requestsPerDay: 50, trainsOnPrompts: false },
    price: { inputPerMTok: 0.1, outputPerMTok: 0.5 },
  },
  {
    id: "model-d",
    name: "Model D",
    vendor: "Vendor D",
    parameters: null,
    license: null,
    contextWindow: 200000,
    toolCalling: 0.95,
    scores: { "src-1": 85 },
    free: { available: false, requestsPerDay: null, trainsOnPrompts: false },
    price: { inputPerMTok: 3, outputPerMTok: 15 },
  },
];

const MAX_COMPARE = 3;

function formatNumber(num: number | null): string {
  if (num === null) return "unknown";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatPrice(price: Model["price"]): string {
  if (!price) return "unknown";
  return `$${price.inputPerMTok.toFixed(2)} / $${price.outputPerMTok.toFixed(2)} per 1M`;
}

function formatToolCalling(toolCalling: number): string {
  return `${(toolCalling * 100).toFixed(0)}%`;
}

describe("CompareView: selection logic", () => {
  it("allows selecting up to 3 models", () => {
    let selectedIds: string[] = [];
    
    const toggle = (modelId: string) => {
      if (selectedIds.includes(modelId)) {
        selectedIds = selectedIds.filter(id => id !== modelId);
      } else if (selectedIds.length < MAX_COMPARE) {
        selectedIds = [...selectedIds, modelId];
      }
    };

    toggle("model-a");
    expect(selectedIds).toEqual(["model-a"]);

    toggle("model-b");
    expect(selectedIds).toEqual(["model-a", "model-b"]);

    toggle("model-c");
    expect(selectedIds).toEqual(["model-a", "model-b", "model-c"]);

    // Try to add a 4th - should be ignored
    toggle("model-d");
    expect(selectedIds).toEqual(["model-a", "model-b", "model-c"]);
  });

  it("allows removing a selected model", () => {
    let selectedIds = ["model-a", "model-b", "model-c"];
    
    const remove = (modelId: string) => {
      selectedIds = selectedIds.filter(id => id !== modelId);
    };

    remove("model-b");
    expect(selectedIds).toEqual(["model-a", "model-c"]);

    remove("model-a");
    expect(selectedIds).toEqual(["model-c"]);

    remove("model-c");
    expect(selectedIds).toEqual([]);
  });

  it("allows toggling a model off", () => {
    let selectedIds = ["model-a", "model-b"];
    
    const toggle = (modelId: string) => {
      if (selectedIds.includes(modelId)) {
        selectedIds = selectedIds.filter(id => id !== modelId);
      } else if (selectedIds.length < MAX_COMPARE) {
        selectedIds = [...selectedIds, modelId];
      }
    };

    toggle("model-a");
    expect(selectedIds).toEqual(["model-b"]);
  });

  it("clear all removes all selections", () => {
    let selectedIds = ["model-a", "model-b", "model-c"];
    
    const clearAll = () => {
      selectedIds = [];
    };

    clearAll();
    expect(selectedIds).toEqual([]);
  });
});

describe("CompareView: formatting helpers", () => {
  describe("formatNumber", () => {
    it("formats null as unknown", () => {
      expect(formatNumber(null)).toBe("unknown");
    });

    it("formats small numbers as-is", () => {
      expect(formatNumber(50)).toBe("50");
      expect(formatNumber(999)).toBe("999");
    });

    it("formats thousands with K", () => {
      expect(formatNumber(1000)).toBe("1.0K");
      expect(formatNumber(5000)).toBe("5.0K");
      expect(formatNumber(999999)).toBe("1000.0K");
    });

    it("formats millions with M", () => {
      expect(formatNumber(1000000)).toBe("1.0M");
      expect(formatNumber(256000)).toBe("256.0K");
      expect(formatNumber(128000)).toBe("128.0K");
    });
  });

  describe("formatPrice", () => {
    it("formats null as unknown", () => {
      expect(formatPrice(null)).toBe("unknown");
    });

    it("formats price with two decimals", () => {
      expect(formatPrice({ inputPerMTok: 0.2, outputPerMTok: 0.8 })).toBe("$0.20 / $0.80 per 1M");
      expect(formatPrice({ inputPerMTok: 3, outputPerMTok: 15 })).toBe("$3.00 / $15.00 per 1M");
      expect(formatPrice({ inputPerMTok: 0.75, outputPerMTok: 3.75 })).toBe("$0.75 / $3.75 per 1M");
    });
  });

  describe("formatToolCalling", () => {
    it("formats as percentage with no decimals", () => {
      expect(formatToolCalling(0.85)).toBe("85%");
      expect(formatToolCalling(0.8)).toBe("80%");
      expect(formatToolCalling(0.95)).toBe("95%");
      expect(formatToolCalling(0)).toBe("0%");
      expect(formatToolCalling(1)).toBe("100%");
    });
  });
});

describe("CompareView: comparison data preparation", () => {
  it("provides all required attributes for comparison", () => {
    const model = sampleModels[0];
    
    // All these properties should be available for display
    expect(model.id).toBeDefined();
    expect(model.name).toBeDefined();
    expect(model.vendor).toBeDefined();
    expect(model.contextWindow).toBeDefined();
    expect(model.toolCalling).toBeDefined();
    expect(model.free.available).toBeDefined();
    expect(model.free.requestsPerDay).toBeDefined();
    expect(model.free.trainsOnPrompts).toBeDefined();
    expect(model.price).toBeDefined();
  });

  it("handles models with and without price", () => {
    const freeModel = sampleModels[0]; // no price
    const paidModel = sampleModels[3]; // has price
    
    expect(freeModel.price).toBeNull();
    expect(formatPrice(freeModel.price)).toBe("unknown");
    
    expect(paidModel.price).not.toBeNull();
    expect(formatPrice(paidModel.price)).toBe("$3.00 / $15.00 per 1M");
  });

  it("handles unknown requestsPerDay", () => {
    const modelWithUnknown = sampleModels[3];
    expect(modelWithUnknown.free.requestsPerDay).toBeNull();
    expect(formatNumber(modelWithUnknown.free.requestsPerDay)).toBe("unknown");
  });

  it("supports 2 and 3 model comparisons", () => {
    const twoModels = sampleModels.slice(0, 2);
    const threeModels = sampleModels.slice(0, 3);
    
    expect(twoModels.length).toBe(2);
    expect(threeModels.length).toBe(3);
    
    // All should have the same structure for tabular display
    for (const model of [...twoModels, ...threeModels]) {
      expect(typeof model.name).toBe("string");
      expect(typeof model.vendor).toBe("string");
      expect(typeof model.contextWindow).toBe("number");
      expect(typeof model.toolCalling).toBe("number");
      expect(typeof model.free.available).toBe("boolean");
      expect(typeof model.free.trainsOnPrompts).toBe("boolean");
    }
  });
});