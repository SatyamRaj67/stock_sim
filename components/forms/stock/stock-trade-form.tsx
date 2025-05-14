"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TransactionType } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import Decimal from "decimal.js";
import { useTradeActions } from "@/hooks/useTradeActions";

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

  const { buyStock, sellStock, isBuying, isSelling, isProcessing } =
    useTradeActions();

  const handleQuantityChange = (value: string) => {
    if (value === "" || /^[1-9]\d*$/.test(value)) {
      const numValue = value === "" ? "" : parseInt(value, 10);
      setQuantity(numValue);
    } else if (value === "0") {
      setQuantity(0);
    }
  };

  const handleTrade = (type: TransactionType) => {
    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      toast.error("Please enter a valid quantity greater than zero.");
      return;
    }
    if (isProcessing(stockId)) return;

    if (type === TransactionType.BUY) {
      buyStock({ stockId, quantity: numQuantity });
    } else if (type === TransactionType.SELL) {
      sellStock({ stockId, quantity: numQuantity });
    }
    setQuantity("");
  };

  const isTradeDisabled = isFrozen || !isActive || isProcessing(stockId);
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
            min="1"
            step="1"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Estimated Cost:</span>
          <span className="font-medium">{formatCurrency(totalCost)}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => handleTrade(TransactionType.BUY)}
            disabled={isTradeDisabled || isSelling(stockId)}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {isBuying(stockId) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Buy"
            )}
          </Button>
          <Button
            onClick={() => handleTrade(TransactionType.SELL)}
            disabled={isTradeDisabled || isBuying(stockId)}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isSelling(stockId) ? (
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
