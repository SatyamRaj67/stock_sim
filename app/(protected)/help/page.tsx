import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { LifeBuoy } from "lucide-react";
import { faqs } from "@/data/faq-data";

const HelpPage = () => {
  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-4 md:p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Help & Support
        </h1>
        <p className="text-muted-foreground mt-2">
          Find answers to your questions or get in touch with our support team.
        </p>
      </div>

      {/* Search Bar */}
      {/* <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
        <Input
          placeholder="Search help topics..."
          className="bg-muted/50 w-full rounded-full py-2 pr-4 pl-10"
        />
      </div> */}

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Quick answers to common questions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact & Documentation Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">Contact Support</CardTitle>
          <LifeBuoy className="text-muted-foreground h-6 w-6" />
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Can&apos;t find what you&apos;re looking for? Our support team is
            here to help.
          </p>
          <Button>Contact Us</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpPage;
