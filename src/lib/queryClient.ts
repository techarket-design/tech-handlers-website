import { QueryClient } from "@tanstack/react-query";

export type PublicQuerySeed = { key: readonly unknown[]; data: unknown }[];

// A new instance per server request prevents sharing visitor/session data.
export function createQueryClient(seed: PublicQuerySeed = []) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
  seed.forEach(({ key, data }) => client.setQueryData(key, data));
  return client;
}
