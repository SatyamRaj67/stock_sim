import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

export const PortfolioList = () => (
  <Card>
    <CardHeader>
      <CardTitle>My Portfolios</CardTitle>
      <CardDescription>Overview of your holdings</CardDescription>
    </CardHeader>
    <CardContent>
      {/* Placeholder for portfolio list */}
      <ul className="space-y-2">
        <li className="flex justify-between">
          <span>Tech Stocks</span> <span>$5,500</span>
        </li>
        <li className="flex justify-between">
          <span>Dividend Fund</span> <span>$3,200</span>
        </li>
        <li className="flex justify-between">
          <span>Crypto</span> <span>$1,800</span>
        </li>
      </ul>
    </CardContent>
  </Card>
);
