import { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  BadgeInfo,
  Settings2,
  Check,
  X,
  ArrowUpDown, // Icon for sorting
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type User, type AdminWatchlist, UserRole } from "@prisma/client";
import { WatchlistTableSkeleton } from "./watchlist-table-skeleton"; // Ensure this is updated for columns prop
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"; // Import TanStack Table hooks and types

// Define the type for the user data we expect
type UserWithWatchlist = User & {
  adminWatchlistEntries: AdminWatchlist[];
};

interface AdminWatchlistTableProps {
  users: UserWithWatchlist[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: any;
}

// --- TanStack Table Column Definitions ---
const columnHelper = createColumnHelper<UserWithWatchlist>();

const columns = [
  // Use columnHelper to define columns
  columnHelper.accessor("id", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        User ID
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => (
      <span className="font-mono text-xs">{info.getValue()}</span>
    ),
    enableSorting: true,
  }),
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => info.getValue() ?? "N/A",
    enableSorting: true,
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: (info) => (
      <span className="text-muted-foreground text-xs">{info.getValue()}</span>
    ),
    enableSorting: false, // Email sorting might not be needed
  }),
  columnHelper.accessor("emailVerified", {
    header: "Verified",
    cell: (info) =>
      info.getValue() ? (
        <Check className="mx-auto h-4 w-4 text-green-600" />
      ) : (
        <X className="mx-auto h-4 w-4 text-red-600" />
      ),
    enableSorting: false,
    meta: {
      // Custom meta for centering
      className: "text-center",
    },
  }),
  columnHelper.accessor("role", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Role
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => {
      const role = info.getValue();
      return (
        <Badge
          variant={
            role === UserRole.SUPER_ADMIN
              ? "destructive"
              : role === UserRole.ADMIN
                ? "secondary"
                : "outline"
          }
        >
          {role}
        </Badge>
      );
    },
    enableSorting: true,
    enableColumnFilter: true, // Enable filtering for this column
    filterFn: "equals", // Use 'equals' filter function
  }),
  columnHelper.accessor("balance", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Balance
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => formatCurrency(info.getValue()),
    enableSorting: true,
  }),
  columnHelper.accessor("createdAt", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Created At
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => format(new Date(info.getValue()), "PP"),
    enableSorting: true,
  }),
  columnHelper.accessor("adminWatchlistEntries", {
    header: "Open Issues",
    cell: (info) => {
      const entries = info.getValue();
      return entries.length > 0 ? (
        <Badge variant="destructive">{entries.length}</Badge>
      ) : (
        <Badge variant="outline">0</Badge>
      );
    },
    enableSorting: false, // Sorting by array length might need custom logic if desired
    meta: {
      // Custom meta for centering
      className: "text-center",
    },
  }),
  // Actions Column
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-2">
        <Link href={`/admin/watchlist/${row.original.id}`} passHref>
          <Button variant="outline" size="sm" title="View Details">
            <BadgeInfo className="h-4 w-4" />
          </Button>
        </Link>
        {/* <Link href={`/admin/users/${row.original.id}`} passHref>
          <Button variant="outline" size="sm" title="View Details">
            <BadgeInfo className="h-4 w-4" />
          </Button>
        </Link> */}
      </div>
    ),
  }),
];
// --- End TanStack Table Column Definitions ---

export const AdminWatchlistTable: React.FC<AdminWatchlistTableProps> = ({
  users = [], // Default to empty array if undefined
  isLoading,
  isError,
  error,
}) => {
  // TanStack Table State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState(""); // For general search
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    // Initial visibility (hide ID by default maybe?)
    id: false,
    emailVerified: false,
    createdAt: false,
  });

  const table = useReactTable({
    data: users,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // debugTable: true, // Uncomment for debugging
  });

  // Handle Role Filter Select change
  const handleRoleFilterChange = (value: string) => {
    if (value === "ALL") {
      // Remove role filter if 'ALL' is selected
      table.getColumn("role")?.setFilterValue(undefined);
    } else {
      table.getColumn("role")?.setFilterValue(value);
    }
  };

  const renderErrorState = () => (
    <TableRow>
      <TableCell colSpan={table.getAllColumns().length}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>
            {error?.message ?? "Could not fetch user watchlist data."}
          </AlertDescription>
        </Alert>
      </TableCell>
    </TableRow>
  );

  const renderEmptyState = () => (
    <TableRow>
      <TableCell
        colSpan={table.getAllColumns().length}
        className="text-muted-foreground text-center"
      >
        No results found.
      </TableCell>
    </TableRow>
  );

  return (
    <div>
      {/* Filter and Column Controls */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row">
          {/* Global Search Input */}
          <Input
            placeholder="Search all columns..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
            disabled={isLoading || isError}
          />
          {/* Role Filter Select */}
          <Select
            value={
              (table.getColumn("role")?.getFilterValue() as string) ?? "ALL"
            }
            onValueChange={handleRoleFilterChange}
            disabled={isLoading || isError}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              {Object.values(UserRole).map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Column Visibility Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={isLoading || isError}>
              <Settings2 className="mr-2 h-4 w-4" /> Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllLeafColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                // Try to get a readable header
                const headerText =
                  typeof column.columnDef.header === "string"
                    ? column.columnDef.header
                    : column.id;
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {headerText}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableCaption>List of users and their watchlist status.</TableCaption>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{
                      width:
                        header.getSize() !== 150 ? header.getSize() : undefined,
                    }}
                    className={(header.column.columnDef.meta as any)?.className}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <WatchlistTableSkeleton columns={table.getAllColumns().length} />
            ) : isError ? (
              renderErrorState()
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        width:
                          cell.column.getSize() !== 150
                            ? cell.column.getSize()
                            : undefined,
                      }}
                      className={(cell.column.columnDef.meta as any)?.className}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              renderEmptyState()
            )}
          </TableBody>
        </Table>
      </div>
      {/* Optional: Add Pagination Controls here */}
    </div>
  );
};
