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

export function AdminStockTable() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  const utils = api.useUtils();

  const {
    data: stocks,
    isLoading,
    error,
  } = api.stockAdmin.getAllStocks.useQuery();

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
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
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
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Market Cap</TableHead>
              <TableHead>Sector</TableHead>
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
                  <TableCell>{formatNumber(stock.volume ?? 0)}</TableCell>
                  <TableCell>{formatNumber(stock.marketCap ?? 0)}</TableCell>
                  <TableCell>{stock.sector ?? "-"}</TableCell>
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

      {/* Add Stock Dialog (Needs Implementation) */}
      <CreateStockDialog
        open={isCreateDialogOpen}
        onClose={handleCloseDialogs}
        onSuccess={() => {
          void utils.stockAdmin.getAllStocks.invalidate();
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
            void utils.stockAdmin.getAllStocks.invalidate(); // Invalidate cache on success
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
            void utils.stockAdmin.getAllStocks.invalidate();
            void handleCloseDialogs();
          }}
        />
      )}
    </div>
  );
}
