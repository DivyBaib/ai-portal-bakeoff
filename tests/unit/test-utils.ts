import { vi } from "vitest";

/** Mock fetch for testing */
export function mockFetch(json: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: () => Promise.resolve(json),
  });
}