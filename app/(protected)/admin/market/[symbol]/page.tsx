"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  AlertCircle,
  Play,
  Pause,
  EyeOff,
  Eye,
  Wand2,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PriceHistoryChart } from "@/components/charts/price-history-chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { StockSimulationSettingsForm } from "@/components/admin/stock-simulation-settings-form";

const historyGenerationDaysOptions = {
  "1": "1 Day",
  "7": "7 Days",
  "30": "1 Month",
  "90": "3 Months",
  "365": "1 Year",
};
type HistoryGenerationDaysKey = keyof typeof historyGenerationDaysOptions;

const AdminStockDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const symbol =
    typeof params.symbol === "string" ? params.symbol.toUpperCase() : undefined;

  const [generateDays, setGenerateDays] =
    useState<HistoryGenerationDaysKey>("30");
  const [chartKey, setChartKey] = useState(() => Date.now());

  const {
    data: stockDetails,
    isLoading: isLoadingDetails,
    error: errorDetails,
    isError: isErrorDetails,
    refetch: refetchStockDetails,
  } = api.stocks.getStockBySymbol.useQuery(
    { symbol: symbol! },
    {
      enabled: !!symbol,
      retry: false,
    },
  );

  // --- Mutations for Admin Actions ---
  const updateStockStatus = api.stocks.updateStock.useMutation({
    onSuccess: async (data) => {
      toast.success(
        `Stock ${data?.symbol ?? stockDetails?.symbol ?? "N/A"} status updated successfully.`,
      );
      await refetchStockDetails();
    },
    onError: (error) => {
      toast.error(`Failed to update stock status: ${error.message}`);
    },
  });

  const generateHistoryMutation =
    api.admin.generateStockPriceHistory.useMutation({
      onSuccess: (data) => {
        toast.success(
          `Generated ${data.count} price history records for ${stockDetails?.symbol}.`,
        );
        setChartKey(Date.now());
      },
      onError: (error) => {
        toast.error(`Failed to generate history: ${error.message}`);
      },
    });

  const handleToggleFreeze = () => {
    if (!stockDetails || updateStockStatus.isPending) return;
    updateStockStatus.mutate({
      id: stockDetails.id,
      currentPrice: Number(stockDetails.currentPrice),
      volume: stockDetails.volume,
      isFrozen: !stockDetails.isFrozen,
    });
  };

  const handleToggleActive = () => {
    if (!stockDetails || updateStockStatus.isPending) return;
    updateStockStatus.mutate({
      id: stockDetails.id,
      currentPrice: Number(stockDetails.currentPrice),
      volume: stockDetails.volume,
      isActive: !stockDetails.isActive,
    });
  };

  const handleGenerateHistory = () => {
    if (!stockDetails || generateHistoryMutation.isPending) return;
    const daysToGenerate = parseInt(generateDays, 10);
    if (isNaN(daysToGenerate) || daysToGenerate <= 0) {
      toast.error("Invalid number of days selected for generation.");
      return;
    }
    generateHistoryMutation.mutate({
      stockId: stockDetails.id,
      days: daysToGenerate,
    });
  };

  if (isLoadingDetails && symbol) {
    return (
      <div className="container mx-auto max-w-4xl space-y-6 p-4 md:p-8">
        <Skeleton className="mb-4 h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="mt-2 h-4 w-1/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="aspect-video h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!symbol || isErrorDetails || (!isLoadingDetails && !stockDetails)) {
    let title = "Error";
    let message = "An unexpected error occurred while fetching stock details.";

    if (!symbol) {
      title = "Invalid Request";
      message = "No stock symbol provided in the URL.";
    } else if (errorDetails?.data?.code === "NOT_FOUND" || !stockDetails) {
      title = "Stock Not Found";
      message = `The stock with symbol "${symbol}" could not be found.`;
    } else if (errorDetails) {
      message = errorDetails.message ?? message;
    }

    return (
      <div className="container mx-auto flex max-w-4xl flex-col items-center space-y-4 p-8 text-center">
        <Alert variant="destructive" className="w-full max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.push("/admin/market")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Market Admin
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push("/admin/market")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Market Admin
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                {stockDetails!.name} ({stockDetails!.symbol})
              </CardTitle>
              <CardDescription>
                Manage details and actions for this stock.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant={stockDetails!.isActive ? "default" : "secondary"}>
                {stockDetails!.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge
                variant={stockDetails!.isFrozen ? "destructive" : "outline"}
              >
                {stockDetails!.isFrozen ? "Frozen" : "Trading Enabled"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 rounded-md border p-4 sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-sm">Current Price</p>
              <p className="font-medium">
                {formatCurrency(stockDetails!.currentPrice)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Sector</p>
              <p className="font-medium">{stockDetails!.sector ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Volume</p>
              <p className="font-medium">
                {formatNumber(stockDetails!.volume)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Status Control</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={stockDetails!.isFrozen ? "secondary" : "destructive"}
                onClick={handleToggleFreeze}
                disabled={updateStockStatus.isPending}
              >
                {stockDetails!.isFrozen ? (
                  <Play className="mr-2 h-4 w-4" />
                ) : (
                  <Pause className="mr-2 h-4 w-4" />
                )}
                {stockDetails!.isFrozen ? "Unfreeze Trading" : "Freeze Trading"}
              </Button>
              <Button
                variant={stockDetails!.isActive ? "secondary" : "default"}
                onClick={handleToggleActive}
                disabled={updateStockStatus.isPending}
              >
                {stockDetails!.isActive ? (
                  <EyeOff className="mr-2 h-4 w-4" />
                ) : (
                  <Eye className="mr-2 h-4 w-4" />
                )}
                {stockDetails!.isActive ? "Deactivate Stock" : "Activate Stock"}
              </Button>
            </div>
          </div>

          <PriceHistoryChart
            key={chartKey}
            stockId={stockDetails!.id}
            title="Price History Preview"
            description={`Current price history for ${stockDetails!.name}`}
          />

          <div className="space-y-3 rounded-md border p-4">
            <h3 className="text-lg font-semibold">
              Generate Fake Price History
            </h3>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-grow space-y-1">
                <Label htmlFor="generate-days">Duration</Label>
                <Select
                  value={generateDays}
                  onValueChange={(value) =>
                    setGenerateDays(value as HistoryGenerationDaysKey)
                  }
                >
                  <SelectTrigger
                    id="generate-days"
                    className="w-full sm:w-[180px]"
                  >
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.keys(
                        historyGenerationDaysOptions,
                      ) as HistoryGenerationDaysKey[]
                    ).map((key) => (
                      <SelectItem key={key} value={key}>
                        {historyGenerationDaysOptions[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleGenerateHistory}
                disabled={generateHistoryMutation.isPending}
                className="w-full sm:w-auto"
              >
                <Wand2 className="mr-2 h-4 w-4" />
                {generateHistoryMutation.isPending
                  ? "Generating..."
                  : "Generate"}
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              This will generate simulated price data for the selected duration,
              ending today. Existing data for overlapping periods might be
              affected depending on the backend logic.
            </p>
          </div>

          <StockSimulationSettingsForm
            stock={{
              ...stockDetails!,
              createdById: stockDetails!.createdById ?? "",
            }}
            onSuccess={refetchStockDetails}
          />

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Other Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href={`/market/${symbol}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Public Page
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStockDetailPage;
