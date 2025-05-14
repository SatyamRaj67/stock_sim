import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const AdminStockTableSkeleton = () => (
  <div className="space-y-4">
    <div className="flex justify-end">
      <Skeleton className="h-10 w-32" />
    </div>

    {/* Skeleton Table for Medium and Up */}
    <div className="hidden overflow-hidden rounded-md border md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-24" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <Skeleton className="h-4 w-24" />
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <Skeleton className="h-4 w-24" />
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-16" />
            </TableHead>
            <TableHead className="w-[100px] text-right">
              <Skeleton className="h-4 w-20" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={`skeleton-row-${index}`}>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell className="space-x-2 text-right">
                <Skeleton className="inline-block h-8 w-16" />
                <Skeleton className="inline-block h-8 w-16" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>

    {/* Skeleton Cards for Small Screens */}
    <div className="grid gap-4 md:hidden">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={`skeleton-card-${index}`} className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-5 w-16" />
            </CardTitle>
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </CardFooter>
        </Card>
      ))}
    </div>
  </div>
);
