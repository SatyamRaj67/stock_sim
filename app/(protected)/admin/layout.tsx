import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { auth } from "@/server/auth";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

interface AdminProtectedProps {
  children: React.ReactNode;
}

export default async function AdminProtectedLayout({
  children,
}: AdminProtectedProps) {
  const session = await auth();

  if (
    !session ||
    (session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.SUPER_ADMIN)
  ) {
    redirect(DEFAULT_LOGIN_REDIRECT);
  }

  return <>{children}</>;
}
