"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpIcon, ArrowDownIcon, Search, Loader2 } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import { TransactionType } from "@prisma/client";
import Decimal from "decimal.js";

const calculatePriceChange = (
  currentPriceInput: Decimal | number | string,
  previousCloseInput: Decimal | number | string | null | undefined,
): Decimal => {
  const currentPrice = new Decimal(currentPriceInput);
  const previousCloseValue = previousCloseInput ?? 0;
  const previousClose = new Decimal(previousCloseValue);

  if (previousClose.isZero()) {
    return new Decimal(0); 
  }
  return currentPrice
    .minus(previousClose)
    .dividedBy(previousClose)
    .times(100);
};


export function MarketTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [processingTrade, setProcessingTrade] = useState<{
    stockId: string;
    type: TransactionType;
  } | null>(null);
  const { data: session } = useSession();

  // Use tRPC query for fetching stocks
  const { data: stocks, isLoading: isLoadingStocks } =
    api.stock.getStocks.useQuery(undefined, {
      enabled: !!session,
    });

  // Use the tRPC mutation hook for trading stocks
  const tradeMutation = api.stock.tradeStock.useMutation({
    onSuccess: (data, variables) => {
      toast.success(data.message || "Trade successful!");

      setQuantities((prev) => {
        const updated = { ...prev };
        delete updated[variables.stockId];
        return updated;
      });
      setProcessingTrade(null);
    },
    onError: (error) => {
      toast.error(error.message || "Trade failed.");
      setProcessingTrade(null); // Clear processing state on error
    },
  });

  const handleQuantityChange = (stockId: string, value: string) => {
    const quantity = parseInt(value, 10);
    if (!isNaN(quantity) && quantity >= 0) {
      setQuantities((prev) => ({
        ...prev,
        [stockId]: quantity,
      }));
    } else if (value === "") {
      // Allow clearing the input
      setQuantities((prev) => {
        const updated = { ...prev };
        delete updated[stockId];
        return updated;
      });
    }
  };

  const handleBuy = (stockId: string) => {
    const quantity = quantities[stockId] || 0;
    if (quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    if (tradeMutation.isPending) return; // Prevent multiple simultaneous trades

    setProcessingTrade({ stockId, type: TransactionType.BUY });
    tradeMutation.mutate({
      stockId,
      quantity,
      type: TransactionType.BUY,
    });

    // Don't clear quantity here, do it in onSuccess
  };

  const handleSell = (stockId: string) => {
    const quantity = quantities[stockId] || 0;
    if (quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    if (tradeMutation.isPending) return; // Prevent multiple simultaneous trades

    setProcessingTrade({ stockId, type: TransactionType.SELL });
    tradeMutation.mutate({
      stockId,
      quantity,
      type: TransactionType.SELL,
    });

    // Don't clear quantity here, do it in onSuccess
  };

  // Ensure stocks is an array before filtering
  const safeStocks = Array.isArray(stocks) ? stocks : [];
  const activeStocks = safeStocks.filter((stock) => stock.isActive);
  const filteredStocks = activeStocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (stock.sector &&
        stock.sector.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="space-y-4">
      <div className="relative flex items-center">
        <Search
          className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400"
          size={18}
        />
        <Input
          placeholder="Search by symbol, name, or sector..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableCaption className="p-2">
            List of available stocks in the market
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Market Cap</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingStocks ? (
              <TableRow>
                <TableCell colSpan={8} className="py-6 text-center">
                  Loading stocks...
                </TableCell>
              </TableRow>
            ) : filteredStocks && filteredStocks.length > 0 ? (
              filteredStocks.map((stock) => {
                const priceChange = calculatePriceChange(
                  stock.currentPrice,
                  stock.previousClose ?? new Decimal(0),
                );
                const isPositiveChange = priceChange >= new Decimal(0);
                // Check if the *current* stock's BUY action is processing
                const isProcessingBuy =
                  tradeMutation.isPending &&
                  processingTrade?.stockId === stock.id &&
                  processingTrade?.type === TransactionType.BUY;
                // Check if the *current* stock's SELL action is processing
                const isProcessingSell =
                  tradeMutation.isPending &&
                  processingTrade?.stockId === stock.id &&
                  processingTrade?.type === TransactionType.SELL;
                // Disable input/buttons if *any* trade is processing for this stock
                const isProcessingCurrentStock =
                  isProcessingBuy || isProcessingSell;

                return (
                  <TableRow key={stock.id}>
                    <TableCell className="font-medium">
                      {stock.symbol}
                    </TableCell>
                    <TableCell>{stock.name}</TableCell>
                    <TableCell>{formatCurrency(stock.currentPrice)}</TableCell>
                    <TableCell>
                      <div
                        className={`flex items-center ${isPositiveChange ? "text-green-600" : "text-red-600"}`}
                      >
                        {isPositiveChange ? (
                          <ArrowUpIcon className="mr-1" size={16} />
                        ) : (
                          <ArrowDownIcon className="mr-1" size={16} />
                        )}
                        {priceChange.toFixed(2)}%
                      </div>
                    </TableCell>
                    <TableCell>{formatNumber(stock.volume)}</TableCell>
                    <TableCell>{formatNumber(stock.marketCap)}</TableCell>
                    <TableCell>{stock.sector || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          className="h-8 w-16"
                          value={quantities[stock.id] || ""} // Control the input value
                          onChange={(e) =>
                            handleQuantityChange(stock.id, e.target.value)
                          }
                          // Disable input if this specific stock is being processed or globally disabled
                          disabled={
                            isProcessingCurrentStock ||
                            stock.isFrozen ||
                            !stock.isActive ||
                            tradeMutation.isPending
                          }
                          min="0" // Prevent negative numbers
                        />

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                          onClick={() => handleBuy(stock.id)}
                          disabled={
                            // Disable if processing this stock, or globally disabled, or any mutation is pending
                            isProcessingCurrentStock ||
                            stock.isFrozen ||
                            !stock.isActive ||
                            tradeMutation.isPending
                          }
                        >
                          {/* Show loader only if this stock's BUY is processing */}
                          {isProcessingBuy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Buy"
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                          onClick={() => handleSell(stock.id)}
                          disabled={
                            // Disable if processing this stock, or globally disabled, or any mutation is pending
                            isProcessingCurrentStock ||
                            stock.isFrozen ||
                            !stock.isActive ||
                            tradeMutation.isPending
                          }
                        >
                          {/* Show loader only if this stock's SELL is processing */}
                          {isProcessingSell ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Sell"
                          )}
                        </Button>
                      </div>

                      {(stock.isFrozen || !stock.isActive) && (
                        <div className="mt-1">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              stock.isFrozen
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {stock.isFrozen ? "Frozen" : "Inactive"}
                          </Badge>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="py-6 text-center">
                  No stocks found or user not authenticated.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
