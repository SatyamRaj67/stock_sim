import {
  ArrowUpRight,
  BarChart3,
  BellRing,
  LineChart,
  Link,
} from "lucide-react";
import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";

const features = [
  {
    title: "Real-time tracking",
    description:
      "Follow your investments with live market data and personalized alerts.",
    icon: <LineChart className="h-10 w-10 text-emerald-500" />,
  },
  {
    title: "Advanced analytics",
    description:
      "Powerful tools to analyze market trends and stock performance.",
    icon: <BarChart3 className="h-10 w-10 text-emerald-500" />,
  },
  {
    title: "Smart notifications",
    description:
      "Get alerted about important market events and price movements.",
    icon: <BellRing className="h-10 w-10 text-emerald-500" />,
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-6">
      <div className="container mx-auto">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Powerful tools for smarter investing
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Everything you need to research, analyze, and make informed
            investment decisions
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, i) => (
            <Card
              key={i}
              className="border-none shadow-sm transition-all hover:shadow-md"
            >
              <CardHeader>
                <div className="mb-4">{feature.icon}</div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="h-auto p-0" asChild>
                  <Link href="#">
                    Learn more <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
