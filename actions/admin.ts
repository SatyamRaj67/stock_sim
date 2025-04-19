"use server";

import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export const admin = async () => {
  const role = await currentRole();

  if (role !== UserRole.ADMIN && role !== UserRole.SUPER_ADMIN) {
    return { error: "Forbidden Server Action!" };
  }

  return { success: "Allowed Server Action!" };
};
