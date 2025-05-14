import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingDown } from "lucide-react"; 

// Define the NotFound component
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center p-4 font-sans">
      <Card className="w-full max-w-md border-red-200 text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-red-100">
            <svg
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-12 w-12 text-red-500"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 18 2 18"></polyline>
              {/* Animated "crashing" part */}
              <style>
                {`
                  @keyframes dip {
                    0% { stroke-dashoffset: 0; }
                    50% { stroke-dashoffset: 20; } /* Adjust length of dip */
                    100% { stroke-dashoffset: 0; }
                  }
                  .dip-animation {
                    stroke-dasharray: 20; /* Match the dip length */
                    animation: dip 2s ease-in-out infinite;
                  }
                `}
              </style>
              {/* Applying the animation class */}
              <polyline
                points="15 21 18 16 20 18"
                className="dip-animation stroke-[3] text-red-600"
              ></polyline>
            </svg>
          </div>
          {/* Card Title - The main heading */}
          <CardTitle className="text-3xl font-bold text-red-700">
            404 - Market Correction!
          </CardTitle>
          {/* Card Description - Explanatory text with a pun */}
          <CardDescription className="text-foreground mt-2 text-lg">
            Oops! This page seems to have taken a sharp downturn.
          </CardDescription>
        </CardHeader>

        {/* Card Content - More details or context */}
        <CardContent>
          <p className="text-background-muted">
            Looks like the asset you were searching for is off the charts... or
            maybe it just doesn&apos;t exist. Don&apos;t worry, your portfolio is safe (we
            hope!).
          </p>
        </CardContent>

        {/* Card Footer - Action button */}
        <CardFooter className="flex justify-center">
          {/* Button linking back to the homepage */}
          <Button
            asChild
            variant="destructive"
            size="lg"
            className="shadow transition-shadow hover:shadow-md"
          >
            <Link href="/">
              <TrendingDown className="mr-2 h-4 w-4" /> Back to Market Floor
              (Home)
            </Link>
          </Button>
        </CardFooter>
      </Card>

      {/* Optional: Add a subtle footer */}
      <footer className="text-foreground-500 mt-8 text-sm">
        Stock Market Simulator Inc. - Always Read the Prospectus (or the URL)!
      </footer>
    </div>
  );
}
