import { db } from "server/db";

export const getUserByEmail = async (email: string) => {
  try {
    const user = await db.user.findUnique({
      where: { email },
    });
    return user;
  } catch {
    return null;
  }
};

export const getUserById = async (id: string) => {
  try {
    const user = await db.user.findUnique({
      where: { id },
    });
    return user;
  } catch {
    return null;
  }
};

export const getUserByIdWithPortfolioAndPositions = async (id: string) => {
  try {
    const user = await db.user.findUnique({
      where: { id },
      include: {
        portfolio: {
          include: {
            positions: {
              include: {
                stock: {
                  select: {
                    id: true,
                    symbol: true,
                    name: true,
                    currentPrice: true,
                    sector: true,
                    logoUrl: true,
                  },
                },
              },
              orderBy: {
                stock: {
                  symbol: "asc",
                },
              },
            },
          },
        },
      },
    });
    return user;
  } catch {
    return null;
  }
};

export const getUserByIdWithAdminWatchlist = async (id: string) => {
  try {
    const user = await db.user.findUnique({
      where: { id },
      include: {
        adminWatchlistEntries: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
    return user;
  } catch {
    return null;
  }
};

export const getAllUsersWithAdminWatchlist = async () => {
  try {
    const users = await db.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        adminWatchlistEntries: {
          where: {
            resolved: false,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
    return users;
  } catch {
    return null;
  }
};

export const updateUserById = async (id: string, data: any) => {
  try {
    const user = await db.user.update({
      where: { id },
      data,
    });
    return user;
  } catch {
    return null;
  }
};
