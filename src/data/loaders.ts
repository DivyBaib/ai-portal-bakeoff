import type { z } from "zod";
import modelsJson from "../../data/seed/models.json";
import harnessesJson from "../../data/seed/harnesses.json";
import providersJson from "../../data/seed/providers.json";
import sourcesJson from "../../data/seed/sources.json";
import {
  harnessesFileSchema,
  modelsFileSchema,
  providersFileSchema,
  sourcesFileSchema,
  type HarnessesFile,
  type ModelsFile,
  type ProvidersFile,
  type SourcesFile,
} from "./schemas";

const MAX_REPORTED_ISSUES = 8;

/** Turns a Zod error into a one-line, readable message for the given file. */
export function formatSeedError(fileName: string, error: z.ZodError): string {
  const issues = error.issues.slice(0, MAX_REPORTED_ISSUES).map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
    return `${path}: ${issue.message}`;
  });
  const remaining = error.issues.length - issues.length;
  const suffix = remaining > 0 ? ` (+${remaining} more)` : "";
  return `Invalid seed data in ${fileName}: ${issues.join("; ")}${suffix}`;
}

function parseSeedFile<T>(
  schema: z.ZodType<T>,
  data: unknown,
  fileName: string,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(formatSeedError(fileName, result.error));
  }
  return result.data;
}

export function parseModelsFile(data: unknown): ModelsFile {
  return parseSeedFile(modelsFileSchema, data, "data/seed/models.json");
}

export function parseHarnessesFile(data: unknown): HarnessesFile {
  return parseSeedFile(harnessesFileSchema, data, "data/seed/harnesses.json");
}

export function parseProvidersFile(data: unknown): ProvidersFile {
  return parseSeedFile(providersFileSchema, data, "data/seed/providers.json");
}

export function parseSourcesFile(data: unknown): SourcesFile {
  return parseSeedFile(sourcesFileSchema, data, "data/seed/sources.json");
}

// Validated seed data. A broken file fails loudly at startup with a readable
// error instead of leaking undefined values into the UI.
export const modelsFile = parseModelsFile(modelsJson);
export const harnessesFile = parseHarnessesFile(harnessesJson);
export const providersFile = parseProvidersFile(providersJson);
export const sourcesFile = parseSourcesFile(sourcesJson);

export const models = modelsFile.models;
export const harnesses = harnessesFile.harnesses;
export const providers = providersFile.providers;
export const sources = sourcesFile.sources;
