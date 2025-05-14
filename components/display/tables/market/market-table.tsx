"use client";

import React, { useState, useMemo } from "react";
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
import {
  ArrowUpIcon,
  ArrowDownIcon,
  Search,
  Loader2,
  ArrowRightFromLine,
} from "lucide-react";
import {
  calculatePriceChange,
  formatCurrency,
  formatNumber,
} from "@/lib/utils";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import { Skeleton } from "../../../ui/skeleton";
import Link from "next/link";
import { useTradeActions } from "@/hooks/useTradeActions";

export function MarketTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number | "">>({});
  const { data: session } = useSession();

  const { buyStock, sellStock, isBuying, isSelling, isProcessing } =
    useTradeActions();

  const { data: stocks, isLoading: isLoadingStocks } =
    api.stocks.getAllStocks.useQuery(undefined, {
      enabled: !!session,
    });

  const handleQuantityChange = (stockId: string, value: string) => {
    if (value === "" || /^[1-9]\d*$/.test(value) || value === "0") {
      if (value.length > 1 && value.startsWith("0")) {
        return;
      }
      const numValue = value === "" ? "" : parseInt(value, 10);
      setQuantities((prev) => ({
        ...prev,
        [stockId]: numValue,
      }));
    }
  };

  const handleBuy = (stockId: string) => {
    const quantityValue = quantities[stockId] ?? "";
    const quantity =
      quantityValue === "" ? 0 : parseInt(String(quantityValue), 10);

    if (quantity <= 0) {
      toast.error("Please enter a valid quantity greater than zero.");
      return;
    }
    buyStock({ stockId, quantity });
    setQuantities((prev) => ({ ...prev, [stockId]: "" }));
  };

  const handleSell = (stockId: string) => {
    const quantityValue = quantities[stockId] ?? "";
    const quantity =
      quantityValue === "" ? 0 : parseInt(String(quantityValue), 10);

    if (quantity <= 0) {
      toast.error("Please enter a valid quantity greater than zero.");
      return;
    }
    sellStock({ stockId, quantity });
    setQuantities((prev) => ({ ...prev, [stockId]: "" }));
  };

  const safeStocks = useMemo(
    () => (Array.isArray(stocks) ? stocks : []),
    [stocks],
  );
  const activeStocks = useMemo(
    () => safeStocks.filter((stock) => stock.isActive),
    [safeStocks],
  );
  const filteredStocks = useMemo(
    () =>
      activeStocks.filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (stock.sector &&
            stock.sector.toLowerCase().includes(searchQuery.toLowerCase())),
      ),
    [activeStocks, searchQuery],
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
          <TableCaption className="table-caption p-2 md:hidden">
            <div className="flex items-center">
              <ArrowRightFromLine />
              &nbsp; &nbsp; Scroll Right to get more values
            </div>
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead className="hidden md:table-cell">Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Change</TableHead>
              <TableHead className="hidden md:table-cell">Volume</TableHead>
              <TableHead className="hidden md:table-cell">Market Cap</TableHead>
              <TableHead className="hidden md:table-cell">Sector</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingStocks ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
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
                    <div className="flex flex-col items-start gap-2 md:flex-row md:items-center">
                      <Skeleton className="h-8 w-20 md:w-16" />
                      <div className="flex w-full gap-2 md:w-auto">
                        <Skeleton className="h-8 flex-1 md:w-12 md:flex-none" />
                        <Skeleton className="h-8 flex-1 md:w-12 md:flex-none" />
                        <Skeleton className="h-8 flex-1 md:w-12 md:flex-none" />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : filteredStocks && filteredStocks.length > 0 ? (
              filteredStocks.map((stock) => {
                const priceChange = calculatePriceChange(
                  stock.currentPrice,
                  stock.previousClose,
                );
                const isPositiveChange = priceChange.gte(0);
                const isBuyingThisStock = isBuying(stock.id);
                const isSellingThisStock = isSelling(stock.id);
                const isProcessingThisStock = isProcessing(stock.id);
                const isDisabled =
                  stock.isFrozen || !stock.isActive || isProcessingThisStock;

                const currentQuantityValue = quantities[stock.id] ?? "";
                const currentQuantityNumber =
                  currentQuantityValue === ""
                    ? 0
                    : parseInt(String(currentQuantityValue), 10);

                return (
                  <TableRow key={stock.id}>
                    <TableCell className="font-medium">
                      {stock.symbol}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {stock.name}
                    </TableCell>
                    <TableCell>{formatCurrency(stock.currentPrice)}</TableCell>
                    <TableCell>
                      <div
                        className={`flex items-center ${
                          isPositiveChange ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isPositiveChange ? (
                          <ArrowUpIcon className="mr-1" size={16} />
                        ) : (
                          <ArrowDownIcon className="mr-1" size={16} />
                        )}
                        {priceChange.toFixed(2)}%
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatNumber(stock.volume)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatNumber(stock.marketCap)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {stock.sector ?? "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          className="h-8 w-16"
                          value={quantities[stock.id] ?? ""}
                          onChange={(e) =>
                            handleQuantityChange(stock.id, e.target.value)
                          }
                          disabled={isDisabled}
                          min="0"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                          onClick={() => handleBuy(stock.id)}
                          disabled={isDisabled || currentQuantityNumber <= 0}
                        >
                          {isBuyingThisStock ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "BUY"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                          onClick={() => handleSell(stock.id)}
                          disabled={isDisabled || currentQuantityNumber <= 0}
                        >
                          {isSellingThisStock ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "SELL"
                          )}
                        </Button>
                        <Link href={`/market/${stock.symbol}`} passHref>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isProcessingThisStock}
                          >
                            Details
                          </Button>
                        </Link>
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
