import { env } from "@/env";
import { BillingClient } from "@/components/billing/billing-client"; 
import { plans } from "@/data/plans";

// Main Billing Page Component (Now a Server Component)
function BillingPage() {
  const stripePublicKey = env.NEXT_PUBLIC_STRIPE_KEY; 

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <h1 className="mb-4 text-center text-3xl font-bold md:text-4xl">
        Choose Your Plan
      </h1>
      <p className="text-muted-foreground mx-auto mb-10 max-w-xl text-center">
        Select the perfect plan for your needs. Upgrade, downgrade, or cancel
        anytime (for subscriptions).
      </p>

      <BillingClient plans={plans} stripePublicKey={stripePublicKey} />

      <div className="text-muted-foreground mt-16 text-center">
        <p>
          Questions?{" "}
          <a href="/contact" className="text-primary hover:underline">
            Contact our support team
          </a>
        </p>
      </div>
    </div>
  );
}

export default BillingPage;
