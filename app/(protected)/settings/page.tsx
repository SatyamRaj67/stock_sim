"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useRef, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import { ReferralDialog } from "@/components/settings/referral-dialog";
import { AdminDialog } from "@/components/settings/admin-dialog";
import { SettingsForm } from "@/components/settings/settings-form";

const SettingsPage = () => {
  const user = useCurrentUser();

  // Easter egg states
  const clickCountRef = useRef(0);
  const [referralDialogOpen, setReferralDialogOpen] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);

  // Handle the settings title click for Easter egg
  const handleTitleClick = () => {
    clickCountRef.current += 1;
    if (clickCountRef.current >= 5) {
      // Show dialog after 5 clicks
      setReferralDialogOpen(true);
      clickCountRef.current = 0; // Reset counter
    }
  };

  // Handle successful referral code entry
  const handleReferralSuccess = () => {
    setReferralDialogOpen(false);
    setAdminDialogOpen(true);
    toast.success("Admin mode activated!");
  };

  return (
    <div className="flex min-h-[10vw] w-full items-center justify-center p-6 md:p-10">
      <Card className="w-[600px]">
        <CardHeader>
          <p
            className="cursor-pointer text-center text-2xl font-semibold"
            onClick={handleTitleClick}
          >
            ⚙️Settings
          </p>
        </CardHeader>
        <CardContent>
          <SettingsForm />
        </CardContent>
      </Card>

      <ReferralDialog
        open={referralDialogOpen}
        onOpenChange={setReferralDialogOpen}
        onSuccess={handleReferralSuccess}
      />

      <AdminDialog
        open={adminDialogOpen}
        onOpenChange={setAdminDialogOpen}
        currentUser={user}
      />
    </div>
  );
};

export default SettingsPage;
