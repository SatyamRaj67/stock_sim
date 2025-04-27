"use client";

import React, { useState } from "react";
import { api } from "@/trpc/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Edit, Trash2 } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { StockEditDialog } from "./stock-edit-dialog";
import { StockDeleteDialog } from "./stock-delete-dialog";
import type { Stock } from "@prisma/client";
import { CreateStockDialog } from "./stock-create-dialog";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";

export function AdminStockTable() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  const utils = api.useUtils();

  const { data: stocks, isLoading, error } = api.stocks.getAllStocks.useQuery();

  const handleOpenEdit = (stock: Stock) => {
    setSelectedStock(stock);
    setIsEditDialogOpen(true);
  };

  const handleOpenDelete = (stock: Stock) => {
    setSelectedStock(stock);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialogs = () => {
    setSelectedStock(null);
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
  };

  if (isLoading) {
    return <AdminStockTableSkeleton />;
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-600">
        Error loading stocks: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Stock
        </Button>
      </div>

      {/* Table for Medium and Up Screens */}
      <div className="hidden overflow-hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="hidden md:table-cell">Volume</TableHead>
              <TableHead className="hidden md:table-cell">Market Cap</TableHead>
              <TableHead className="hidden md:table-cell">Sector</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks && stocks.length > 0 ? (
              stocks.map((stock) => (
                <TableRow key={stock.id}>
                  <TableCell className="font-medium">{stock.symbol}</TableCell>
                  <TableCell>{stock.name}</TableCell>
                  <TableCell>{formatCurrency(stock.currentPrice)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatNumber(stock.volume ?? 0)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatNumber(stock.marketCap ?? 0)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {stock.sector ?? "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {!stock.isActive && (
                        <Badge variant="outline" className="bg-red-700">
                          Inactive
                        </Badge>
                      )}
                      {stock.isFrozen && (
                        <Badge
                          variant="outline"
                          className="bg-blue-800 text-blue-100"
                        >
                          Frozen
                        </Badge>
                      )}
                      {stock.isActive && !stock.isFrozen && (
                        <Badge
                          variant="outline"
                          className="bg-green-800 text-green-100"
                        >
                          Active
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(stock)}
                    >
                      <Edit size={12} /> Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleOpenDelete(stock)}
                    >
                      <Trash2 size={12} /> Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No stocks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Card List for Small Screens */}
      <div className="grid gap-4 md:hidden">
        {stocks && stocks.length > 0 ? (
          stocks.map((stock) => (
            <Card key={`${stock.id}-mobile`} className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{stock.symbol}</span>
                  <div className="flex flex-wrap gap-1">
                    {!stock.isActive && (
                      <Badge variant="outline" className="bg-red-700 text-xs">
                        Inactive
                      </Badge>
                    )}
                    {stock.isFrozen && (
                      <Badge
                        variant="outline"
                        className="bg-blue-800 text-xs text-blue-100"
                      >
                        Frozen
                      </Badge>
                    )}
                    {stock.isActive && !stock.isFrozen && (
                      <Badge
                        variant="outline"
                        className="bg-green-800 text-xs text-green-100"
                      >
                        Active
                      </Badge>
                    )}
                  </div>
                </CardTitle>
                <div className="text-muted-foreground text-sm">
                  {stock.name}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <strong>Price:</strong> {formatCurrency(stock.currentPrice)}
                </div>
                <div>
                  <strong>Volume:</strong> {formatNumber(stock.volume ?? 0)}
                </div>
                <div>
                  <strong>Market Cap:</strong>{" "}
                  {formatNumber(stock.marketCap ?? 0)}
                </div>
                <div>
                  <strong>Sector:</strong> {stock.sector ?? "-"}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(stock)}
                >
                  <Edit size={12} className="mr-1" /> Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleOpenDelete(stock)}
                >
                  <Trash2 size={12} className="mr-1" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="text-muted-foreground py-10 text-center">
            No stocks found.
          </div>
        )}
      </div>

      {/* Add Stock Dialog */}
      <CreateStockDialog
        open={isCreateDialogOpen}
        onClose={handleCloseDialogs}
        onSuccess={() => {
          void utils.stocks.getAllStocks.invalidate();
          void handleCloseDialogs();
        }}
      />

      {/* Edit Stock Dialog */}
      {selectedStock && (
        <StockEditDialog
          stock={selectedStock}
          open={isEditDialogOpen}
          onClose={handleCloseDialogs}
          onSuccess={() => {
            void utils.stocks.getAllStocks.invalidate();
            void handleCloseDialogs();
          }}
        />
      )}

      {/* Delete Stock Dialog */}
      {selectedStock && (
        <StockDeleteDialog
          stockId={selectedStock.id}
          stockSymbol={selectedStock.symbol}
          open={isDeleteDialogOpen}
          onClose={handleCloseDialogs}
          onSuccess={() => {
            void utils.stocks.getAllStocks.invalidate();
            void handleCloseDialogs();
          }}
        />
      )}
    </div>
  );
}

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
