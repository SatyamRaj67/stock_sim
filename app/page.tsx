import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, BarChart, CheckCircle, TrendingUp } from "lucide-react"; // Example icons

const HomePage = () => {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="from-background to-muted/50 flex flex-col items-center justify-center bg-gradient-to-b py-20 text-center md:py-32">
        <div className="container max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Welcome to StockSim!
          </h1>
          <p className="text-muted-foreground mt-4 text-lg md:text-xl">
            Your personal virtual stock market playground. Practice trading,
            test strategies, and learn without the real-world risk.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/register">Sign Up Now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section (Optional) */}
      <section className="bg-muted/50 py-12 md:py-16">
        <div className="container grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          <div>
            <h3 className="text-3xl font-bold">10+</h3>
            <p className="text-muted-foreground">Inactive Users</p>
          </div>
          <div>
            <h3 className="text-3xl font-bold">$99M+</h3>
            <p className="text-muted-foreground">Virtual Trades Daily</p>
          </div>
          <div>
            <h3 className="text-3xl font-bold">10+</h3>
            <p className="text-muted-foreground">Stocks Available</p>
          </div>
          <div>
            <h3 className="text-3xl font-bold">4.8/5</h3>
            <p className="text-muted-foreground">User Rating</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container p-2 md:p-8">
        <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
          Why Choose StockSim?
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          <Card>
            <CardHeader className="items-center">
              <TrendingUp className="text-primary mb-2 h-10 w-10" />
              <CardTitle>Realistic Simulation</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-center">
              Experience market dynamics with real-time (or near real-time) data
              in a risk-free environment.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="items-center">
              <BarChart className="text-primary mb-2 h-10 w-10" />
              <CardTitle>Learn & Strategize</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-center">
              Test various trading strategies, analyze outcomes, and refine your
              approach without financial loss.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="items-center">
              <CheckCircle className="text-primary mb-2 h-10 w-10" />
              <CardTitle>Track Progress</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-center">
              Monitor your virtual portfolio&apos;s performance, view
              transaction history, and gain insights.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 text-center">
        <div className="container">
          <h2 className="text-3xl font-bold">Ready to Start Trading?</h2>
          <p className="mt-2">
            Join thousands of users learning the stock market.
          </p>
          <Button asChild variant="secondary" size="lg" className="mt-6">
            <Link href="/auth/register">Get Started for Free</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
