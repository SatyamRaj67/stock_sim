"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Loader2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { Plan, PlansData } from "@/types";

// Define props type for PlanCard component
interface PlanCardProps {
  plan: Plan;
  popular?: boolean;
  stripePublicKey: string;
}

// Helper component to render a single plan card with typed props
function PlanCard({ plan, popular, stripePublicKey }: PlanCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const createCheckoutSession = api.billing.createCheckoutSession.useMutation();
  const stripePromise = loadStripe(stripePublicKey);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const sessionData = await createCheckoutSession.mutateAsync({
        priceId: plan.priceId,
      });

      if (sessionData?.url) {
        // Redirect to Stripe Checkout
        window.location.href = sessionData.url;
      } else {
        toast.error("Could not initiate checkout. Please try again.");
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error("Checkout Error:", error);
      toast.error(
        error.message || "An error occurred during checkout. Please try again.",
      );
      setIsLoading(false);
    }
    // No need to set isLoading to false if redirecting
  };

  // Handle "Contact Sales" case - prevent checkout attempt
  const isContactSales = plan.cta === "Contact Sales";

  return (
    <Card
      className={`flex flex-col ${
        popular ? "border-primary border-2 shadow-lg" : ""
      }`}
    >
      <CardHeader className="pb-4">
        {popular && (
          <div className="text-primary mb-2 text-sm font-semibold">
            Most Popular
          </div>
        )}
        <CardTitle>{plan.title}</CardTitle>
        <CardDescription className="pt-1">{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-6">
          <span className="text-4xl font-bold">{plan.price}</span>
          {plan.period && (
            <span className="text-muted-foreground">{plan.period}</span>
          )}
        </div>
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm">
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={popular ? "default" : "outline"}
          onClick={
            isContactSales
              ? () => (window.location.href = "/contact")
              : handleCheckout
          } // Redirect or handle checkout
          disabled={isLoading || createCheckoutSession.isPending} // Disable button when loading
        >
          {isLoading || createCheckoutSession.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isLoading || createCheckoutSession.isPending
            ? "Processing..."
            : plan.cta}
        </Button>
      </CardFooter>
    </Card>
  );
}

interface BillingClientProps {
  plans: PlansData;
  stripePublicKey: string;
}

export function BillingClient({ plans, stripePublicKey }: BillingClientProps) {
  return (
    <Tabs defaultValue="monthly" className="mx-auto w-full max-w-4xl">
      {/* Tab Triggers */}
      <TabsList className="mb-8 grid w-full grid-cols-3">
        <TabsTrigger value="oneTime">One-Time</TabsTrigger>
        <TabsTrigger value="monthly">Monthly</TabsTrigger>
        <TabsTrigger value="annual">Annual (Save ~17%)</TabsTrigger>
      </TabsList>

      {/* One-Time Plans Content */}
      <TabsContent value="oneTime">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {plans.oneTime.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              popular={plan.popular}
              stripePublicKey={stripePublicKey}
            />
          ))}
        </div>
      </TabsContent>

      {/* Monthly Plans Content */}
      <TabsContent value="monthly">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.monthly.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              popular={plan.popular}
              stripePublicKey={stripePublicKey}
            />
          ))}
        </div>
      </TabsContent>

      {/* Annual Plans Content */}
      <TabsContent value="annual">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.annual.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              popular={plan.popular}
              stripePublicKey={stripePublicKey}
            />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
