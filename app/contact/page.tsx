"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactSchema } from "@/schemas";
import { Mail, Send } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FormError } from "@/components/forms/form-error";
import { FormSuccess } from "@/components/forms/form-success";

// TODO: Implement server action for sending email
// import { sendContactEmail } from "@/actions/contact";

export default function ContactPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  const form = useForm<z.infer<typeof ContactSchema>>({
    resolver: zodResolver(ContactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = (values: z.infer<typeof ContactSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      console.log("Form submitted:", values);
      // sendContactEmail(values)
      //   .then((data) => {
      //     if (data?.error) {
      //       setError(data.error);
      //       toast.error("Failed to send message.");
      //     }
      //     if (data?.success) {
      //       setSuccess(data.success);
      //       toast.success("Message sent successfully!");
      //       form.reset();
      //     }
      //   })
      //   .catch(() => {
      //      setError("Something went wrong!");
      //      toast.error("Something went wrong!");
      //   });

      // Placeholder success for UI testing
      setTimeout(() => {
        setSuccess("Message sent successfully!");
        toast.success("Message sent successfully!");
        form.reset();
      }, 1000);
    });
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-theme(spacing.16))] max-w-2xl flex-col items-center justify-center gap-8 px-4 py-12 md:py-16">
      <Card className="w-full shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Get in Touch
          </CardTitle>
          <p className="text-muted-foreground">
            Have questions or feedback? Fill out the form below.
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Your Name"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="your.email@example.com"
                        type="email"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Subject of your message"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Type your message here..."
                        className="min-h-[120px]"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormError message={error} />
              <FormSuccess message={success} />
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  "Sending..."
                ) : (
                  <>
                    Send Message <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground mt-4 flex items-center space-x-2">
        <Mail className="h-5 w-5" />
        <span>Or email us directly at satyamrajgaya434@gmail.com</span>
      </div>
    </div>
  );
}
