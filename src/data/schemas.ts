import { z } from "zod";

/**
 * Schemas for the four bundled seed files in `data/seed/`.
 *
 * The data is sample data, but it still has to be well formed: the loaders
 * validate it at startup and throw a readable error when a file is broken.
 */

const idSchema = z.string().min(1, "must not be empty");
const noticeSchema = z.string().min(1, "must not be empty");

/** Adds a readable "duplicate id" issue for repeated ids in a seed list. */
function uniqueById<T extends { id: string }>(
  items: T[],
  ctx: z.RefinementCtx,
): void {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    if (seen.has(item.id)) {
      ctx.addIssue({
        code: "custom",
        message: `duplicate id "${item.id}"`,
        path: [index, "id"],
      });
    }
    seen.add(item.id);
  });
}

const scoreSchema = z.number().min(0).max(100);

export const modelSchema = z.object({
  id: idSchema,
  name: z.string().min(1, "must not be empty"),
  vendor: z.string().min(1, "must not be empty"),
  parameters: z.string().min(1).nullable(),
  license: z.string().min(1).nullable(),
  contextWindow: z.number().int().positive(),
  toolCalling: z.number().min(0).max(1),
  scores: z.record(z.string(), scoreSchema),
  free: z.object({
    available: z.boolean(),
    requestsPerDay: z.number().int().nonnegative().nullable(),
    trainsOnPrompts: z.boolean(),
  }),
  price: z
    .object({
      inputPerMTok: z.number().nonnegative(),
      outputPerMTok: z.number().nonnegative(),
    })
    .nullable(),
});

export const modelsFileSchema = z.object({
  _notice: noticeSchema,
  models: z.array(modelSchema).superRefine(uniqueById),
});

export const harnessSchema = z.object({
  id: idSchema,
  name: z.string().min(1, "must not be empty"),
  kind: z.enum(["terminal", "ide-extension"]),
  providerAgnostic: z.boolean(),
  license: z.string().min(1).nullable(),
  githubUrl: z.url().nullable(),
});

export const harnessesFileSchema = z.object({
  _notice: noticeSchema,
  harnesses: z.array(harnessSchema).superRefine(uniqueById),
});

const freeTierSchema = z.object({
  available: z.boolean(),
  requestsPerDay: z.number().int().nonnegative().nullable(),
  trainsOnPrompts: z.boolean().nullable(),
});

export const providerSchema = z.object({
  id: idSchema,
  name: z.string().min(1, "must not be empty"),
  freeTier: freeTierSchema,
  sourceUrl: z.url(),
  lastVerified: z.string().min(1).nullable(),
});

export const providersFileSchema = z.object({
  _notice: noticeSchema,
  providers: z.array(providerSchema).superRefine(uniqueById),
});

export const sourceSchema = z.object({
  id: idSchema,
  name: z.string().min(1, "must not be empty"),
  reliability: z.number().min(0).max(1),
  relevance: z.number().min(0).max(1),
  ageDays: z.number().nonnegative(),
});

export const sourcesFileSchema = z.object({
  _notice: noticeSchema,
  sources: z.array(sourceSchema).superRefine(uniqueById),
});

export type Model = z.infer<typeof modelSchema>;
export type ModelsFile = z.infer<typeof modelsFileSchema>;
export type Harness = z.infer<typeof harnessSchema>;
export type HarnessesFile = z.infer<typeof harnessesFileSchema>;
export type Provider = z.infer<typeof providerSchema>;
export type ProvidersFile = z.infer<typeof providersFileSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type SourcesFile = z.infer<typeof sourcesFileSchema>;
