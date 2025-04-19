"use client";

import { admin } from "@/actions/admin";
import { RoleGate } from "@/components/auth/role-gate";
import { FormSuccess } from "@/components/layout/form-success";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { UserRole } from "@prisma/client";
import { toast } from "sonner";

const AdminPage = () => {
  // Get tRPC utils to access the client
  const utils = api.useUtils();

  async function onServerActionClick() {
    await admin().then((res) => {
      if (res.success) {
        toast.success(res.success);
      } else {
        toast.error(res.error);
      }
    });
  }

  // Make the handler async and use the tRPC client directly
  const onApiRouteClick = async () => {
    toast.info("Testing API route...");
    try {
      const query = await utils.client.admin.adminTest.query();
      if (query.success) {
        toast.success("Allowed API Route!");
      } else {
        toast.error("API Route check failed.");
      }
    } catch (error) {
      console.error("API Route Test Error:", error);
      toast.error("Not allowed API Route!");
    }
  };

  return (
    <div className="flex min-h-[10vw] w-full items-center justify-center p-6 md:p-10">
      <Card className="w-[600px]">
        <CardHeader>
          <p className="text-center text-2xl font-semibold">🗝️Admin</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <RoleGate allowedRoles={UserRole.ADMIN}>
            <FormSuccess message="You are allowed to see this content!" />
          </RoleGate>

          <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-md">
            <p className="text-sm font-medium">Admin-Only API Route</p>
            <Button onClick={onApiRouteClick}>Click to Test</Button>
          </div>

          <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-md">
            <p className="text-sm font-medium">Admin-Only Server Action</p>
            <Button onClick={onServerActionClick}>Click to Test</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPage;
