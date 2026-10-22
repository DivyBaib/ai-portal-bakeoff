import { describe, expect, it } from "vitest";
import modelsJson from "../../data/seed/models.json";
import harnessesJson from "../../data/seed/harnesses.json";
import providersJson from "../../data/seed/providers.json";
import sourcesJson from "../../data/seed/sources.json";
import {
  formatSeedError,
  harnessesFile,
  modelsFile,
  parseHarnessesFile,
  parseModelsFile,
  parseProvidersFile,
  parseSourcesFile,
  providersFile,
  sourcesFile,
} from "../../src/data";
import { z } from "zod";

const MODELS_FILE = "data/seed/models.json";

function expectReadableError(
  parse: () => unknown,
  fileName: string,
  path: RegExp,
): void {
  let message = "";
  try {
    parse();
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  expect(message).toContain(`Invalid seed data in ${fileName}`);
  expect(message).toMatch(path);
  expect(message).not.toContain("[object Object]");
}

describe("seed loaders", () => {
  it("loads every bundled seed file as-is", () => {
    expect(modelsFile.models).toHaveLength(6);
    expect(harnessesFile.harnesses).toHaveLength(6);
    expect(providersFile.providers).toHaveLength(3);
    expect(sourcesFile.sources).toHaveLength(4);
  });

  it("keeps unknown values as null", () => {
    const nemotron = modelsFile.models.find(
      (model) => model.id === "nemotron-3-ultra",
    );
    expect(nemotron?.parameters).toBeNull();
    expect(nemotron?.license).toBeNull();
    expect(nemotron?.price).toBeNull();

    const paid = modelsFile.models.find(
      (model) => model.id === "sample-paid-frontier",
    );
    expect(paid?.free.requestsPerDay).toBeNull();
  });

  it("accepts valid seed data for each file", () => {
    expect(parseModelsFile(modelsJson).models).toHaveLength(6);
    expect(parseHarnessesFile(harnessesJson).harnesses).toHaveLength(6);
    expect(parseProvidersFile(providersJson).providers).toHaveLength(3);
    expect(parseSourcesFile(sourcesJson).sources).toHaveLength(4);
  });

  it("rejects a model with a non-numeric context window", () => {
    const invalid = {
      ...modelsJson,
      models: [
        { ...modelsJson.models[0], contextWindow: "256k" },
        ...modelsJson.models.slice(1),
      ],
    };
    expectReadableError(
      () => parseModelsFile(invalid),
      MODELS_FILE,
      /models\.0\.contextWindow/,
    );
  });

  it("rejects a tool-calling value outside 0..1", () => {
    const invalid = {
      ...modelsJson,
      models: [
        { ...modelsJson.models[0], toolCalling: 1.5 },
        ...modelsJson.models.slice(1),
      ],
    };
    expectReadableError(
      () => parseModelsFile(invalid),
      MODELS_FILE,
      /models\.0\.toolCalling/,
    );
  });

  it("rejects duplicate model ids", () => {
    const invalid = {
      ...modelsJson,
      models: [
        modelsJson.models[0],
        { ...modelsJson.models[1], id: modelsJson.models[0].id },
      ],
    };
    expectReadableError(
      () => parseModelsFile(invalid),
      MODELS_FILE,
      /duplicate id "nemotron-3-ultra"/,
    );
  });

  it("rejects a file without a notice", () => {
    const invalid = { models: modelsJson.models };
    expectReadableError(
      () => parseModelsFile(invalid),
      MODELS_FILE,
      /_notice/,
    );
  });

  it("rejects unknown harness kinds and bad provider URLs", () => {
    const invalidHarness = {
      ...harnessesJson,
      harnesses: [
        { ...harnessesJson.harnesses[0], kind: "desktop-app" },
        ...harnessesJson.harnesses.slice(1),
      ],
    };
    expectReadableError(
      () => parseHarnessesFile(invalidHarness),
      "data/seed/harnesses.json",
      /harnesses\.0\.kind/,
    );

    const invalidProvider = {
      ...providersJson,
      providers: [
        { ...providersJson.providers[0], sourceUrl: "not a url" },
        ...providersJson.providers.slice(1),
      ],
    };
    expectReadableError(
      () => parseProvidersFile(invalidProvider),
      "data/seed/providers.json",
      /providers\.0\.sourceUrl/,
    );
  });

  it("rejects source weights outside 0..1", () => {
    const invalid = {
      ...sourcesJson,
      sources: [
        { ...sourcesJson.sources[0], reliability: 1.2 },
        ...sourcesJson.sources.slice(1),
      ],
    };
    expectReadableError(
      () => parseSourcesFile(invalid),
      "data/seed/sources.json",
      /sources\.0\.reliability/,
    );
  });

  it("formats a Zod error with paths, messages and extra-issue count", () => {
    const result = z
      .object({ models: z.array(z.object({ id: z.string() })) })
      .safeParse({ models: [{ id: 1 }, { id: 2 }] });
    expect(result.success).toBe(false);
    if (result.success) return;
    const message = formatSeedError("fixture.json", result.error);
    expect(message).toContain("Invalid seed data in fixture.json");
    expect(message).toContain("models.0.id");
  });
});
