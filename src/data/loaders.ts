import { z } from "zod";
import {
  ModelsFileSchema,
  HarnessesFileSchema,
  ProvidersFileSchema,
  SourcesFileSchema,
  type Model,
  type Harness,
  type Provider,
  type Source,
} from "./schemas";

/** Error thrown when seed data validation fails */
export class SeedDataError extends Error {
  constructor(
    public readonly file: string,
    public readonly issues: readonly z.ZodIssue[],
  ) {
    const details = issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    super(`Invalid seed data in ${file}: ${details}`);
    this.name = "SeedDataError";
  }
}

/** Load and validate models.json */
export async function loadModels(): Promise<Model[]> {
  return loadAndValidate("models.json", ModelsFileSchema, (data) => data.models);
}

/** Load and validate harnesses.json */
export async function loadHarnesses(): Promise<Harness[]> {
  return loadAndValidate("harnesses.json", HarnessesFileSchema, (data) => data.harnesses);
}

/** Load and validate providers.json */
export async function loadProviders(): Promise<Provider[]> {
  return loadAndValidate("providers.json", ProvidersFileSchema, (data) => data.providers);
}

/** Load and validate sources.json */
export async function loadSources(): Promise<Source[]> {
  return loadAndValidate("sources.json", SourcesFileSchema, (data) => data.sources);
}

/** Load all seed data at once */
export async function loadAllSeedData(): Promise<{
  models: Model[];
  harnesses: Harness[];
  providers: Provider[];
  sources: Source[];
}> {
  const [models, harnesses, providers, sources] = await Promise.all([
    loadModels(),
    loadHarnesses(),
    loadProviders(),
    loadSources(),
  ]);
  return { models, harnesses, providers, sources };
}

/** Generic loader that fetches, parses, and validates a JSON file */
async function loadAndValidate<TFile, TResult>(
  filename: string,
  schema: z.ZodType<TFile>,
  extract: (data: TFile) => TResult,
): Promise<TResult> {
  const response = await fetch(`/data/seed/${filename}`);
  if (!response.ok) {
    throw new Error(`Failed to load ${filename}: ${response.status} ${response.statusText}`);
  }
  const json = await response.json();
  const result = schema.safeParse(json);
  if (!result.success) {
    throw new SeedDataError(filename, result.error.issues);
  }
  return extract(result.data as TFile);
}