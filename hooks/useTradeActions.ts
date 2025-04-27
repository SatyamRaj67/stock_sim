import { useState } from "react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { TransactionType } from "@prisma/client";
import { useCurrentUser } from "./useCurrentUser";

// Define the input structure for buy/sell actions
interface TradeInput {
  stockId: string;
  quantity: number;
}

export function useTradeActions() {
  const [processingTrade, setProcessingTrade] = useState<{
    stockId: string;
    type: TransactionType;
  } | null>(null);

  const user = useCurrentUser();
  const utils = api.useUtils();

  // --- Success Handler ---
  // Centralized handler for successful trades
  const handleSuccess = (
    variables: TradeInput,
    type: TransactionType,
    stockSymbol?: string,
  ) => {
    toast.success(
      `Successfully ${type === "BUY" ? "bought" : "sold"} ${variables.quantity} shares of ${stockSymbol ?? "stock"}.`,
    );

    utils.user.getUserById.invalidate(user!.id!);
    utils.user.getTransactions.invalidate();
    utils.stocks.getAllStocks.invalidate();
    utils.stocks.getStockBySymbol.invalidate({ symbol: stockSymbol });
  };

  // --- Error Handler ---
  const handleError = (error: any, type: TransactionType) => {
    toast.error(`${type} failed: ${error.message}`);
  };

  // --- Settled Handler ---
  // Clears processing state for the specific trade
  const handleSettled = (variables: TradeInput, type: TransactionType) => {
    if (
      processingTrade?.stockId === variables.stockId &&
      processingTrade?.type === type
    ) {
      setProcessingTrade(null);
    }
  };

  // --- Buy Mutation ---
  const buyMutation = api.trade.buyStocks.useMutation({
    onSuccess: (data, variables) => {
      // We might need the stock symbol here for a better toast message.
      // If the mutation returns the stock or we fetch it separately:
      // handleSuccess(variables, "BUY", data.stock?.symbol);
      handleSuccess(variables, "BUY");
    },
    onError: (error) => handleError(error, "BUY"),
    onSettled: (_data, _error, variables) => handleSettled(variables, "BUY"),
  });

  // --- Sell Mutation ---
  const sellMutation = api.trade.sellStocks.useMutation({
    onSuccess: (data, variables) => {
      // Similar to buy, potentially get symbol for better message
      handleSuccess(variables, "SELL");
    },
    onError: (error) => handleError(error, "SELL"),
    onSettled: (_data, _error, variables) => handleSettled(variables, "SELL"),
  });

  // --- Exposed Actions ---
  const buyStock = (input: TradeInput) => {
    if (input.quantity <= 0) {
      toast.error("Quantity must be greater than zero.");
      return;
    }
    setProcessingTrade({ stockId: input.stockId, type: "BUY" });
    buyMutation.mutate(input);
  };

  const sellStock = (input: TradeInput) => {
    if (input.quantity <= 0) {
      toast.error("Quantity must be greater than zero.");
      return;
    }
    setProcessingTrade({ stockId: input.stockId, type: "SELL" });
    sellMutation.mutate(input);
  };

  // --- Helper Functions for Status ---
  const isBuying = (stockId: string): boolean =>
    processingTrade?.stockId === stockId && processingTrade?.type === "BUY";

  const isSelling = (stockId: string): boolean =>
    processingTrade?.stockId === stockId && processingTrade?.type === "SELL";

  const isProcessing = (stockId: string): boolean =>
    processingTrade?.stockId === stockId;

  return {
    buyStock,
    sellStock,
    isBuying,
    isSelling,
    isProcessing,
    // Expose raw mutations if needed for more complex scenarios
    buyMutation,
    sellMutation,
  };
}
