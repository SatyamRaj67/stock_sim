import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

export const RecentTransactions = () => (
  <Card>
    <CardHeader>
      <CardTitle>Recent Transactions</CardTitle>
      <CardDescription>Last 5 transactions</CardDescription>
    </CardHeader>
    <CardContent>
      {/* Placeholder for transactions */}
      <ul className="space-y-2">
        <li className="flex justify-between">
          <span>BUY AAPL</span> <span className="text-green-500">+$500</span>
        </li>
        <li className="flex justify-between">
          <span>SELL GOOGL</span> <span className="text-red-500">-$300</span>
        </li>
        <li className="flex justify-between">
          <span>BUY MSFT</span> <span className="text-green-500">+$450</span>
        </li>
        <li className="flex justify-between">
          <span>DEPOSIT</span> <span className="text-blue-500">+$1000</span>
        </li>
        <li className="flex justify-between">
          <span>BUY TSLA</span> <span className="text-green-500">+$200</span>
        </li>
      </ul>
    </CardContent>
  </Card>
);
