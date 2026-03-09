import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useGames() {
  return useQuery({
    queryKey: [api.games.list.path],
    queryFn: async () => {
      const res = await fetch(api.games.list.path, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch games");
      }
      const data = await res.json();
      
      // Parse with logging to handle Zod issues gracefully
      const result = api.games.list.responses[200].safeParse(data);
      if (!result.success) {
        console.error("[Zod] Games list validation failed:", result.error.format());
        throw result.error;
      }
      
      return result.data;
    },
  });
}
