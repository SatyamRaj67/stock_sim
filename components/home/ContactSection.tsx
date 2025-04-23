import React from "react";
import { Button } from "../ui/button";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton"; // Import Skeleton

const ContactSection = () => {
  return (
    <section className="px-4 py-16">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="mb-4 text-3xl font-bold md:text-4xl">
          Ready to start your investment journey?
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-lg">
          Join thousands of investors already using StockSmart to achieve their
          financial goals
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link href="/auth/login">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
              Create free account
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="text-foreground border-background hover:bg-foregorund/10"
          >
            Contact sales
          </Button>
        </div>
      </div>
    </section>
  );
};

export const ContactSectionSkeleton = () => (
  <section className="px-4 py-16">
    <div className="container mx-auto max-w-4xl text-center">
      <Skeleton className="h-10 w-3/4 mx-auto mb-4" /> {/* Title */}
      <Skeleton className="h-6 w-1/2 mx-auto mb-8" /> {/* Subtitle */}
      <div className="flex flex-col justify-center gap-4 sm:flex-row">
        <Skeleton className="h-12 w-48" /> {/* Button 1 */}
        <Skeleton className="h-12 w-36" /> {/* Button 2 */}
      </div>
    </div>
  </section>
);

export default ContactSection;
