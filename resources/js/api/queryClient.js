import { QueryClient } from '@tanstack/react-query';

/**
 * Shared TanStack QueryClient with default caching and retry settings.
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 2, // 2 minutes
            gcTime: 1000 * 60 * 10, // 10 minutes cache retention
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
                // Do not retry 401, 403, or 404
                if ([401, 403, 404, 422].includes(error?.status)) {
                    return false;
                }
                return failureCount < 2;
            },
        },
        mutations: {
            retry: false,
        },
    },
});

export default queryClient;
