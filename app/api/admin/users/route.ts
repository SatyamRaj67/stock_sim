import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { db } from "@/server/db";

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();

    // Basic validation
    const updateSchema = z.object({
      userId: z.string(),
      role: z
        .enum([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN])
        .optional(),
      balance: z.number().nonnegative().optional(),
    });

    const validatedData = updateSchema.parse(data);

    // Build update object based on provided fields
    const updateData: Partial<{ role: UserRole; balance: number }> = {};
    if (validatedData.role) updateData.role = validatedData.role;
    if (validatedData.balance !== undefined)
      updateData.balance = validatedData.balance;

    // Update the user
    const user = await db.user.update({
      where: { id: validatedData.userId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        balance: user.balance,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to update user";

    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
