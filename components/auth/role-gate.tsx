"use client";

import type { UserRole } from "@prisma/client";

import { useCurrentRole } from "@/hooks/useCurrentRole";

import { FormError } from "@/components/layout/form-error";

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles: UserRole;
}

export const RoleGate = ({ children, allowedRoles }: RoleGateProps) => {
  const role = useCurrentRole();

  if (role !== allowedRoles) {
    return (
      <FormError message="You do not have permission to view this content!" />
    );
  }

  return <>{children}</>;
};
