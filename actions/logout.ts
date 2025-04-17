"use server";

import { signOut } from "@/server/auth";

export const logout = async () => {
  // Some Server Stuff
  await signOut();
};
