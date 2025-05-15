import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function PortfolioListSkeleton() {
  // Create 5 placeholder rows
  const rows = Array.from({ length: 5 }, (_, i) => i);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Holdings</CardTitle>
        <CardDescription>Overview of your holdings</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right">P/L</TableHead>
              <TableHead className="text-right">% of Port.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  <div className="flex flex-col gap-1">
                    <div className="skeleton h-4 w-16"></div>
                    <div className="skeleton h-3 w-24"></div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="skeleton ml-auto h-4 w-12"></div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="skeleton ml-auto h-4 w-16"></div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="skeleton ml-auto h-4 w-14"></div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="skeleton ml-auto h-4 w-10"></div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
