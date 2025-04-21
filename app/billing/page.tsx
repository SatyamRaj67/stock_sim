import React from "react";
import { Button } from "@/components/ui/button"; // Assuming ShadCN Button path
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // Assuming ShadCN Card path
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Assuming ShadCN Tabs path
import { CheckCircle2 } from "lucide-react"; // Using lucide-react for icons

// Define the TypeScript interface for a Plan
interface Plan {
  id: string;
  title: string;
  description: string;
  price: string;
  features: string[];
  cta: string;
  period?: string; // Optional property for monthly/annual plans
  popular?: boolean; // Optional property to highlight the plan
}

// Define the structure for the plans object
interface PlansData {
  oneTime: Plan[];
  monthly: Plan[];
  annual: Plan[];
}

// Mock data for subscription plans (replace with your actual data)
const plans: PlansData = {
  oneTime: [
    {
      id: "ot_basic",
      title: "Basic Report",
      description: "A single detailed report.",
      price: "$49",
      features: ["One-time analysis", "Standard metrics", "Email support"],
      cta: "Purchase Now",
    },
    {
      id: "ot_pro",
      title: "Pro Report Pack",
      description: "Pack of 5 detailed reports.",
      price: "$199",
      features: [
        "Five reports bundle",
        "Advanced metrics",
        "Priority email support",
      ],
      cta: "Purchase Pack",
    },
  ],
  monthly: [
    {
      id: "mo_starter",
      title: "Starter Monthly",
      description: "Ideal for individuals getting started.",
      price: "$29",
      period: "/month",
      features: [
        "Up to 10 reports/mo",
        "Basic analytics",
        "Community support",
        "Cancel anytime",
      ],
      cta: "Choose Starter",
    },
    {
      id: "mo_business",
      title: "Business Monthly",
      description: "Perfect for small teams & businesses.",
      price: "$79",
      period: "/month",
      features: [
        "Up to 50 reports/mo",
        "Advanced analytics",
        "Priority support",
        "Team features",
        "Cancel anytime",
      ],
      cta: "Choose Business",
      popular: true, // Highlight this plan
    },
    {
      id: "mo_enterprise",
      title: "Enterprise Monthly",
      description: "For large organizations.",
      price: "$249",
      period: "/month",
      features: [
        "Unlimited reports",
        "Custom analytics",
        "Dedicated support",
        "API Access",
        "Cancel anytime",
      ],
      cta: "Contact Sales",
    },
  ],
  annual: [
    {
      id: "yr_starter",
      title: "Starter Annual",
      description: "Get 2 months free!",
      price: "$290",
      period: "/year",
      features: [
        "Up to 10 reports/mo",
        "Basic analytics",
        "Community support",
        "Billed annually",
      ],
      cta: "Choose Starter Annual",
    },
    {
      id: "yr_business",
      title: "Business Annual",
      description: "Most popular, with savings!",
      price: "$790",
      period: "/year",
      features: [
        "Up to 50 reports/mo",
        "Advanced analytics",
        "Priority support",
        "Team features",
        "Billed annually",
      ],
      cta: "Choose Business Annual",
      popular: true, // Highlight this plan
    },
    {
      id: "yr_enterprise",
      title: "Enterprise Annual",
      description: "Best value for large teams.",
      price: "$2490",
      period: "/year",
      features: [
        "Unlimited reports",
        "Custom analytics",
        "Dedicated support",
        "API Access",
        "Billed annually",
      ],
      cta: "Contact Sales",
    },
  ],
};

// Define props type for PlanCard component
interface PlanCardProps {
  plan: Plan;
  popular?: boolean; // popular is optional
}

// Helper component to render a single plan card with typed props
function PlanCard({ plan, popular }: PlanCardProps) {
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
        {/* Pass the correct variant based on the popular prop */}
        <Button className="w-full" variant={popular ? "default" : "outline"}>
          {plan.cta}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Main Billing Page Component
function BillingPage(): React.ReactElement {
  // Added return type for the component
  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <h1 className="mb-4 text-center text-3xl font-bold md:text-4xl">
        Choose Your Plan
      </h1>
      <p className="text-muted-foreground mx-auto mb-10 max-w-xl text-center">
        Select the perfect plan for your needs. Upgrade, downgrade, or cancel
        anytime (for subscriptions).
      </p>

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
            {/* Pass the popular prop explicitly */}
            {plans.oneTime.map((plan) => (
              <PlanCard key={plan.id} plan={plan} popular={plan.popular} />
            ))}
          </div>
        </TabsContent>

        {/* Monthly Plans Content */}
        <TabsContent value="monthly">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Pass the popular prop explicitly */}
            {plans.monthly.map((plan) => (
              <PlanCard key={plan.id} plan={plan} popular={plan.popular} />
            ))}
          </div>
        </TabsContent>

        {/* Annual Plans Content */}
        <TabsContent value="annual">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Pass the popular prop explicitly */}
            {plans.annual.map((plan) => (
              <PlanCard key={plan.id} plan={plan} popular={plan.popular} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Optional: Add FAQs or Contact Section */}
      <div className="text-muted-foreground mt-16 text-center">
        <p>
          Questions?{" "}
          <a href="/contact" className="text-primary hover:underline">
            Contact our support team
          </a>
          .
        </p>
      </div>
    </div>
  );
}

export default BillingPage; // Export the component
