import { db } from "@/server/db";

export const getVerificationTokenByEmail = async (email: string) => {
  try {
    const verificationToken = await db.verificationToken.findFirst({
      where: { email },
    });

    return verificationToken;
  } catch {
    return null;
  }
};

export const getAllVerificationTokensByEmail = async (
  email: string,
  expired?: boolean,
) => {
  try {
    const verificationTokens = await db.verificationToken.findMany({
      where: {
        email,
        ...(expired && {
          expires: { gt: new Date() },
          orderBy: { expires: "asc" },
        }),
      },
      select: {
        identifier: false,
      },
    });

    return verificationTokens;
  } catch {
    return null;
  }
};

export const getVerificationTokenByToken = async (token: string) => {
  try {
    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
    });

    return verificationToken;
  } catch {
    return null;
  }
};
