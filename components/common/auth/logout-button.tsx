"use client";

import { logout } from "@/actions/logout";
import { Button } from "@/components/ui/button";

interface LogoutButtonProps {
  children?: React.ReactNode;
}

export const LogoutButton = ({ children }: LogoutButtonProps) => {
  const onClick = () => {
    void logout();
  };

  return (
    <Button onClick={onClick} className="cursor-pointer">
      {children}
    </Button>
  );
};
