"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { ReferralDialog } from "@/components/dialogs/settings/referral-dialog";
import { AdminDialog } from "@/components/dialogs/settings/admin-dialog";
import { SettingsForm } from "@/components/forms/settings/settings-form";
import clsx from "clsx";

const SettingsPage = () => {
  // Easter egg states
  const clickCountRef = useRef(0);
  const [referralDialogOpen, setReferralDialogOpen] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);

  const [isRotating, setIsRotating] = useState(false);

  // Handle the settings title click for Easter egg
  const handleTitleClick = () => {
    // Trigger rotation
    setIsRotating(true);
    setTimeout(() => setIsRotating(false), 200);

    clickCountRef.current += 1;
    if (clickCountRef.current >= 5) {
      // Show dialog after 5 clicks
      setReferralDialogOpen(true);
      clickCountRef.current = 0;
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
          <p className="cursor-default text-center text-2xl font-semibold">
            <span
              onClick={handleTitleClick}
              className={clsx(
                "inline-block cursor-pointer transition-transform duration-200 ease-in-out", // Base styles
                isRotating && "rotate-[25deg]",
              )}
            >
              ⚙️
            </span>
            Settings
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

      <AdminDialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen} />
    </div>
  );
};

export default SettingsPage;
