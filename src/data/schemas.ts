import { z } from "zod";

/** Schema for a single model entry from models.json */
export const ModelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  vendor: z.string().min(1),
  parameters: z.string().nullable(),
  license: z.string().nullable(),
  contextWindow: z.number().int().nonnegative(),
  toolCalling: z.number().min(0).max(1),
  scores: z.record(z.string(), z.number().min(0).max(100)),
  free: z.object({
    available: z.boolean(),
    requestsPerDay: z.number().int().positive().nullable(),
    trainsOnPrompts: z.boolean(),
  }),
  price: z
    .object({
      inputPerMTok: z.number().nonnegative(),
      outputPerMTok: z.number().nonnegative(),
    })
    .nullable(),
});

/** Schema for the models.json file */
export const ModelsFileSchema = z.object({
  _notice: z.string(),
  models: z.array(ModelSchema),
});

/** Schema for a single harness entry from harnesses.json */
export const HarnessSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(["terminal", "ide-extension"]),
  providerAgnostic: z.boolean(),
  license: z.string().nullable(),
  githubUrl: z.string().url().nullable(),
});

/** Schema for the harnesses.json file */
export const HarnessesFileSchema = z.object({
  _notice: z.string(),
  harnesses: z.array(HarnessSchema),
});

/** Schema for a single provider entry from providers.json */
export const ProviderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  freeTier: z.object({
    available: z.boolean(),
    requestsPerDay: z.number().int().positive().nullable(),
    trainsOnPrompts: z.boolean().nullable(),
  }),
  sourceUrl: z.string().url(),
  lastVerified: z.string().nullable(),
});

/** Schema for the providers.json file */
export const ProvidersFileSchema = z.object({
  _notice: z.string(),
  providers: z.array(ProviderSchema),
});

/** Schema for a single source entry from sources.json */
export const SourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  reliability: z.number().min(0).max(1),
  relevance: z.number().min(0).max(1),
  ageDays: z.number().int().nonnegative(),
});

/** Schema for the sources.json file */
export const SourcesFileSchema = z.object({
  _notice: z.string(),
  sources: z.array(SourceSchema),
});

/** Type inferred from ModelSchema */
export type Model = z.infer<typeof ModelSchema>;

/** Type inferred from HarnessSchema */
export type Harness = z.infer<typeof HarnessSchema>;

/** Type inferred from ProviderSchema */
export type Provider = z.infer<typeof ProviderSchema>;

/** Type inferred from SourceSchema */
export type Source = z.infer<typeof SourceSchema>;