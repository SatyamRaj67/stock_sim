import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

function ContactPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-12 md:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold">
            Contact Us
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6 text-center">
            Have questions about our Enterprise plans or need support? Fill out
            the form below, and we'll get back to you shortly.
          </p>
          {/* Simple form structure without client-side logic */}
          <form className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Your Name" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="Inquiry Subject" />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Your message..." rows={5} />
            </div>
            <Button type="submit" className="w-full">
              Send Message
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default ContactPage;
