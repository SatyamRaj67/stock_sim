"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";

import { auth } from "@/server/auth";
import { db } from "@/server/db";

import type { SettingsSchema } from "@/schemas";

import { getUserByEmail, getUserById } from "@/data/user";

import { sendVerificationEmail } from "@/lib/mail";
import { generateVerificationToken } from "@/lib/tokens";

export const settings = async (values: z.infer<typeof SettingsSchema>) => {
  const session = await auth();
  const user = session?.user || null;

  if (!user || !user.id) {
    return { error: "Unauthorized" };
  }

  const prismaUser = await getUserById(user.id);

  if (!prismaUser) {
    return { error: "Unathorized" };
  }

  if (user.isOAuth) {
    values.email = undefined;
    values.password = undefined;
    values.newPassword = undefined;
    values.isTwoFactorEnabled = undefined;
  }

  if (values.email && values.email !== user.email) {
    const existingUser = await getUserByEmail(values.email);

    if (existingUser && existingUser.id !== user.id) {
      return { error: "Email already in use!" };
    }

    const verificationToken = await generateVerificationToken(values.email);
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token,
    );

    return { success: "Verification Email Sent!" };
  }

  if (values.password && values.newPassword && prismaUser.password) {
    const passwordsMatch = await bcrypt.compare(
      values.password,
      prismaUser.password,
    );

    if (!passwordsMatch) {
      return { error: "Invalid Password!" };
    }

    const hashedPassword = await bcrypt.hash(values.newPassword, 10);

    values.password = hashedPassword;
    values.newPassword = undefined;
  }

  await db.user.update({
    where: { id: user.id },
    data: { ...values },
  });

  return { success: "Settings Updated!" };
};
