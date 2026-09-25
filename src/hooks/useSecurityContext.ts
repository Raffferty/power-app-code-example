import { useEffect, useState } from "react";
import { SystemusersService } from "@/generated/services/SystemusersService";
import { RolesService } from "@/generated/services/RolesService";
import { useCurrentUser } from "./useCurrentUser";

export const ORDER_ADMIN_ROLE = "Order Admin";
export const ORDER_USER_ROLE = "Order User";

export interface SecurityContext {
  loading: boolean;
  error: string | null;
  systemUserId: string | null;
  roleNames: string[];
  isOrderAdmin: boolean;
  isOrderUser: boolean;
  hasAccess: boolean;
}

const INITIAL_ROLE_STATE = {
  systemUserId: null as string | null,
  roleNames: [] as string[],
  isOrderAdmin: false,
  isOrderUser: false,
  hasAccess: false,
};

export function useSecurityContext(): SecurityContext {
  const { user, loading: userLoading, error: userError } = useCurrentUser();
  const [roleState, setRoleState] = useState(INITIAL_ROLE_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userLoading) return;

    let cancelled = false;

    async function resolve() {
      if (userError || !user) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        // getContext().user.objectId is the Azure AD object id, a different GUID
        // from the Dataverse systemuserid, so it has to be resolved via a lookup.
        let systemUserId: string | undefined;

        if (user.objectId) {
          const byObjectId = await SystemusersService.getAll({
            filter: `azureactivedirectoryobjectid eq ${user.objectId}`,
            select: ["systemuserid"],
          });
          systemUserId = byObjectId.success ? byObjectId.data?.[0]?.systemuserid : undefined;
        }

        if (!systemUserId && user.userPrincipalName) {
          const upn = user.userPrincipalName.replace(/'/g, "''");
          const byUpn = await SystemusersService.getAll({
            filter: `internalemailaddress eq '${upn}' or domainname eq '${upn}'`,
            select: ["systemuserid"],
          });
          systemUserId = byUpn.success ? byUpn.data?.[0]?.systemuserid : undefined;
        }

        if (cancelled) return;

        if (!systemUserId) {
          setError("Could not resolve your Dataverse user record.");
          setRoleState(INITIAL_ROLE_STATE);
          setLoading(false);
          return;
        }

        const rolesResult = await RolesService.getAll({
          filter: `systemuserroles_association/any(o:o/systemuserid eq ${systemUserId})`,
          select: ["name"],
        });

        if (cancelled) return;

        if (!rolesResult.success) {
          setError(rolesResult.error?.message ?? "Failed to load your security roles.");
          setLoading(false);
          return;
        }

        const roleNames = (rolesResult.data ?? []).map((role) => role.name);
        const isOrderAdmin = roleNames.includes(ORDER_ADMIN_ROLE);
        const isOrderUser = roleNames.includes(ORDER_USER_ROLE);

        setRoleState({
          systemUserId,
          roleNames,
          isOrderAdmin,
          isOrderUser,
          hasAccess: isOrderAdmin || isOrderUser,
        });
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to resolve security roles.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    resolve();

    return () => {
      cancelled = true;
    };
  }, [user, userLoading, userError]);

  return {
    loading: userLoading || loading,
    error: userError ?? error,
    ...roleState,
  };
}
