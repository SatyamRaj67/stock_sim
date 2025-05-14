import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface WatchlistTableSkeletonProps {
  columns?: number;
}

export const WatchlistTableSkeleton: React.FC<WatchlistTableSkeletonProps> = ({
  columns = 5,
}) => {
  return (
    <>
      {[...Array(columns)].map((_, i: number) => (
        <TableRow key={`skel-${i}`}>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-40" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell className="text-center">
            <Skeleton className="mx-auto h-4 w-8" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-6" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
};
