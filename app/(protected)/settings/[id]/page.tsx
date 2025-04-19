"use client";

import { api } from "@/trpc/react";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams<{ id: string }>();
  const userQuery = api.user.getById.useQuery(params.id);
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">My Id:</h1>
      {userQuery.isLoading && <p>Loading...</p>}
      {userQuery.error && <p>Error: {userQuery.error.message}</p>}
      {userQuery.data && (
        <p className="mt-4">{JSON.stringify(userQuery.data)}</p>
      )}
    </div>
  );
}
