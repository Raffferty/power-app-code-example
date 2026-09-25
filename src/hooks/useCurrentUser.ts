import { useEffect, useState } from "react";
import { getContext } from "@microsoft/power-apps/app";

export interface CurrentUser {
  fullName: string;
  userPrincipalName?: string;
  objectId?: string;
}

interface UseCurrentUserResult {
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
}

export function useCurrentUser(): UseCurrentUserResult {
  const [state, setState] = useState<UseCurrentUserResult>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const context = await getContext();
        if (cancelled) return;
        setState({
          user: {
            fullName: context.user.fullName ?? context.user.userPrincipalName ?? "Unknown User",
            userPrincipalName: context.user.userPrincipalName,
            objectId: context.user.objectId,
          },
          loading: false,
          error: null,
        });
      } catch (err) {
        if (cancelled) return;
        setState({
          user: null,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to load the current user.",
        });
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
