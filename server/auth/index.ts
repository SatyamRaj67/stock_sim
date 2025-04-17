import NextAuth from "next-auth";
import { cache } from "react";

import { authConfig } from "./config";
import { db } from "../db";
import { getUserById } from "@/data/user";
import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation";
import type { UserRole } from "@prisma/client";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getAccountByUserId } from "@/data/account";

const {
  auth: uncachedAuth,
  handlers,
  signIn,
  signOut,
} = NextAuth({
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
        },
      });
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // Allow OAuth without email verificaion
      if (account?.type !== "credentials") return true;

      if (!user.id) return false;

      const existingUser = await getUserById(user.id);

      // Prevent sign in without email verification
      if (!existingUser?.emailVerified) {
        return false;
      }

      if (existingUser.isTwoFactorEnabled) {
        const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(
          existingUser.id,
        );

        if (!twoFactorConfirmation) return false;

        // Delete Two Factor Confirmation for Next SignIn
        await db.twoFactorConfirmation.delete({
          where: { id: twoFactorConfirmation.id },
        });
      }

      return true;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
      }
      if (session.user) {
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.isOAuth = token.isOAuth as boolean;
      }

      return session;
    },

    async jwt({ token }) {
      if (!token.sub) return token;

      const exisitingUser = await getUserById(token.sub);

      if (!exisitingUser) return token;

      const existingAccount = await getAccountByUserId(exisitingUser.id);

      token.isOAuth = !!existingAccount;
      token.name = exisitingUser.name;
      token.email = exisitingUser.email;
      token.role = exisitingUser.role;
      token.isTwoFactorEnabled = exisitingUser.isTwoFactorEnabled;

      return token;
    },
  },
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  ...authConfig,
});

const auth = cache(uncachedAuth);

export { auth, handlers, signIn, signOut };
