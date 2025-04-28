import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

export const PortfolioChart = () => (
  <Card>
    <CardHeader>
      <CardTitle>Portfolio Value Trend</CardTitle>
      <CardDescription>Last 30 days performance</CardDescription>
    </CardHeader> 
    <CardContent>
      {/* Placeholder for chart */}
      <div className="bg-secondary flex h-60 items-center justify-center rounded">
        <p className="text-muted-foreground">Chart Placeholder</p>
        {/* In a real scenario, you'd render a chart component here */}
        {/* Example fake data structure for a chart */}
        {/* const chartData = [
                      { date: '2025-03-28', value: 10000 },
                      { date: '2025-04-05', value: 10500 },
                      { date: '2025-04-12', value: 10200 },
                      { date: '2025-04-19', value: 11000 },
                      { date: '2025-04-26', value: 11500 },
                  ]; */}
      </div>
    </CardContent>
  </Card>
);
