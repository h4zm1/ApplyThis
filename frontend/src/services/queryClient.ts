import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30secs before the data is considered "old"
      refetchOnWindowFocus: false, // no refreshing on alt tab (leaving and coming back to page tab)
      retry: 1, // try it failed requests once before showing error
    },
  },
});
