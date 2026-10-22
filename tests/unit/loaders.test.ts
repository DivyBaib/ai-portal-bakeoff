import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadModels, loadHarnesses, loadProviders, loadSources, SeedDataError } from "../../src/data/loaders";
import { mockFetch } from "./test-utils";

describe("data loaders", () => {
  const validModelsJson = {
    _notice: "SAMPLE DATA for development only.",
    models: [
      {
        id: "test-model",
        name: "Test Model",
        vendor: "Test Vendor",
        parameters: null,
        license: null,
        contextWindow: 128000,
        toolCalling: 0.8,
        scores: { "test-source": 75 },
        free: { available: true, requestsPerDay: 100, trainsOnPrompts: false },
        price: { inputPerMTok: 0.5, outputPerMTok: 1.5 },
      },
    ],
  };

  const validHarnessesJson = {
    _notice: "SAMPLE DATA for development only.",
    harnesses: [
      { id: "test-harness", name: "Test Harness", kind: "terminal" as const, providerAgnostic: true, license: null, githubUrl: null },
    ],
  };

  const validProvidersJson = {
    _notice: "SAMPLE DATA for development only.",
    providers: [
      { id: "test-provider", name: "Test Provider", freeTier: { available: true, requestsPerDay: 50, trainsOnPrompts: true }, sourceUrl: "https://example.com", lastVerified: null },
    ],
  };

  const validSourcesJson = {
    _notice: "SAMPLE DATA for development only.",
    sources: [
      { id: "test-source", name: "Test Source", reliability: 0.9, relevance: 0.8, ageDays: 7 },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const setFetchMock = (mock: ReturnType<typeof mockFetch>) => {
    vi.stubGlobal("fetch", mock);
  };

  describe("loadModels", () => {
    it("loads and validates valid models data", async () => {
      setFetchMock(mockFetch(validModelsJson));
      const models = await loadModels();
      expect(models).toHaveLength(1);
      expect(models[0].id).toBe("test-model");
      expect(models[0].name).toBe("Test Model");
      expect(models[0].vendor).toBe("Test Vendor");
      expect(models[0].contextWindow).toBe(128000);
      expect(models[0].toolCalling).toBe(0.8);
      expect(models[0].scores).toEqual({ "test-source": 75 });
      expect(models[0].free.available).toBe(true);
      expect(models[0].free.requestsPerDay).toBe(100);
      expect(models[0].free.trainsOnPrompts).toBe(false);
      expect(models[0].price).toEqual({ inputPerMTok: 0.5, outputPerMTok: 1.5 });
    });

    it("rejects invalid models data with readable error", async () => {
      const invalidJson = {
        _notice: "SAMPLE DATA",
        models: [
          {
            id: "",
            name: "Test",
            vendor: "Test",
            parameters: null,
            license: null,
            contextWindow: -1,
            toolCalling: 1.5,
            scores: {},
            free: { available: true, requestsPerDay: 100, trainsOnPrompts: false },
            price: null,
          },
        ],
      };
      setFetchMock(mockFetch(invalidJson));
      await expect(loadModels()).rejects.toThrow(SeedDataError);
      await expect(loadModels()).rejects.toThrow("Invalid seed data in models.json");
    });

    it("rejects missing required fields", async () => {
      const invalidJson = {
        _notice: "SAMPLE DATA",
        models: [
          {
            id: "test",
            name: "Test",
            vendor: "Test",
            parameters: null,
            license: null,
            contextWindow: 1000,
            toolCalling: 0.5,
            scores: {},
            free: { available: true, requestsPerDay: 100 },
            price: null,
          },
        ],
      };
      setFetchMock(mockFetch(invalidJson));
      await expect(loadModels()).rejects.toThrow(SeedDataError);
    });
  });

  describe("loadHarnesses", () => {
    it("loads and validates valid harnesses data", async () => {
      setFetchMock(mockFetch(validHarnessesJson));
      const harnesses = await loadHarnesses();
      expect(harnesses).toHaveLength(1);
      expect(harnesses[0].id).toBe("test-harness");
      expect(harnesses[0].name).toBe("Test Harness");
      expect(harnesses[0].kind).toBe("terminal");
      expect(harnesses[0].providerAgnostic).toBe(true);
    });

    it("rejects invalid harnesses data", async () => {
      const invalidJson = {
        _notice: "SAMPLE DATA",
        harnesses: [{ id: "test", name: "Test", kind: "invalid", providerAgnostic: true, license: null, githubUrl: null }],
      };
      setFetchMock(mockFetch(invalidJson));
      await expect(loadHarnesses()).rejects.toThrow(SeedDataError);
    });
  });

  describe("loadProviders", () => {
    it("loads and validates valid providers data", async () => {
      setFetchMock(mockFetch(validProvidersJson));
      const providers = await loadProviders();
      expect(providers).toHaveLength(1);
      expect(providers[0].id).toBe("test-provider");
      expect(providers[0].name).toBe("Test Provider");
      expect(providers[0].freeTier.available).toBe(true);
      expect(providers[0].freeTier.requestsPerDay).toBe(50);
      expect(providers[0].freeTier.trainsOnPrompts).toBe(true);
      expect(providers[0].sourceUrl).toBe("https://example.com");
    });

    it("rejects invalid providers data", async () => {
      const invalidJson = {
        _notice: "SAMPLE DATA",
        providers: [{ id: "test", name: "Test", freeTier: { available: true, requestsPerDay: 50, trainsOnPrompts: true }, sourceUrl: "not-a-url", lastVerified: null }],
      };
      setFetchMock(mockFetch(invalidJson));
      await expect(loadProviders()).rejects.toThrow(SeedDataError);
    });
  });

  describe("loadSources", () => {
    it("loads and validates valid sources data", async () => {
      setFetchMock(mockFetch(validSourcesJson));
      const sources = await loadSources();
      expect(sources).toHaveLength(1);
      expect(sources[0].id).toBe("test-source");
      expect(sources[0].name).toBe("Test Source");
      expect(sources[0].reliability).toBe(0.9);
      expect(sources[0].relevance).toBe(0.8);
      expect(sources[0].ageDays).toBe(7);
    });

    it("rejects invalid sources data", async () => {
      const invalidJson = {
        _notice: "SAMPLE DATA",
        sources: [{ id: "test", name: "Test", reliability: 1.5, relevance: 0.8, ageDays: 7 }],
      };
      setFetchMock(mockFetch(invalidJson));
      await expect(loadSources()).rejects.toThrow(SeedDataError);
    });
  });

  describe("network errors", () => {
    it("throws on fetch failure", async () => {
      setFetchMock(mockFetch({}, false, 404));
      await expect(loadModels()).rejects.toThrow("Failed to load models.json: 404 Error");
    });
  });
});