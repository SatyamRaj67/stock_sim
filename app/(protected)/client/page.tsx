"use client";

import React from "react";

import { useCurrentUser } from "@/hooks/useCurrentUser";

import { UserInfo } from "@/components/auth/user-info";

const ClientPage = () => {
  const user = useCurrentUser();

  return (
    <div className="flex min-h-[10vw] w-full items-center justify-center p-6 md:p-10">
      <UserInfo label="📱Client Component" user={user} />{" "}
    </div>
  );
};

export default ClientPage;
