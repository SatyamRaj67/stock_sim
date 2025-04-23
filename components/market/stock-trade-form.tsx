"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { TransactionType } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import Decimal from "decimal.js";

interface StockTradeFormProps {
  stockId: string;
  symbol: string;
  currentPrice: Decimal | number;
  isFrozen: boolean;
  isActive: boolean;
}

export function StockTradeForm({
  stockId,
  symbol,
  currentPrice,
  isFrozen,
  isActive,
}: StockTradeFormProps) {
  const [quantity, setQuantity] = useState<number | string>("");
  const [processingTrade, setProcessingTrade] =
    useState<TransactionType | null>(null);

  const tradeMutation = api.stock.tradeStock.useMutation({
    onSuccess: (data, variables) => {
      toast.success(data.message ?? "Trade successful!");
      setQuantity(""); // Reset quantity on success
      setProcessingTrade(null);
      // Optionally refetch user balance or portfolio data here if needed
    },
    onError: (error) => {
      toast.error(error.message ?? "Trade failed.");
      setProcessingTrade(null);
    },
  });

  const handleQuantityChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      setQuantity(num);
    } else if (value === "") {
      setQuantity("");
    }
  };

  const handleTrade = (type: TransactionType) => {
    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    if (tradeMutation.isPending) return;

    setProcessingTrade(type);
    tradeMutation.mutate({
      stockId,
      quantity: numQuantity,
      type,
    });
  };

  const isTradeDisabled = isFrozen || !isActive || tradeMutation.isPending;
  const currentPriceNum = new Decimal(currentPrice).toNumber();
  const totalCost =
    typeof quantity === "number" ? quantity * currentPriceNum : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade {symbol}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Current Price:</span>
          <span className="font-medium">{formatCurrency(currentPrice)}</span>
        </div>
        <div>
          <label htmlFor="quantity" className="mb-1 block text-sm font-medium">
            Quantity
          </label>
          <Input
            id="quantity"
            type="number"
            placeholder="0"
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            disabled={isTradeDisabled}
            min="0"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Estimated Cost:</span>
          <span className="font-medium">{formatCurrency(totalCost)}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => handleTrade(TransactionType.BUY)}
            disabled={
              isTradeDisabled || processingTrade === TransactionType.SELL
            }
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {processingTrade === TransactionType.BUY ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Buy"
            )}
          </Button>
          <Button
            onClick={() => handleTrade(TransactionType.SELL)}
            disabled={
              isTradeDisabled || processingTrade === TransactionType.BUY
            }
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {processingTrade === TransactionType.SELL ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Sell"
            )}
          </Button>
        </div>
        {(isFrozen || !isActive) && (
          <p className="text-destructive text-center text-sm">
            Trading is currently {isFrozen ? "frozen" : "inactive"} for this
            stock.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
