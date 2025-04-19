import React from "react";
import { currentUser } from "@/lib/auth";
import { UserInfo } from "@/components/auth/user-info";

const ServerPage = async () => {
  const user = await currentUser();
  return (
    <div className="flex min-h-[10vw] w-full items-center justify-center p-6 md:p-10">
      <UserInfo label="💻Server Component" user={user} />{" "}
    </div>
  );
};

export default ServerPage;
