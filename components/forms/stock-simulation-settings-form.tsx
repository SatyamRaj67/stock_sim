"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type * as z from "zod";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { StockSimulationSettingsSchema } from "@/schemas";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Decimal from "decimal.js";
import type { Stock } from "@prisma/client";

type SimulationSettingsFormValues = z.infer<
  typeof StockSimulationSettingsSchema
>;

interface StockSimulationSettingsFormProps {
  stock: Stock;
  onSuccess?: () => void; // Optional callback on successful update
}

export function StockSimulationSettingsForm({
  stock,
  onSuccess,
}: StockSimulationSettingsFormProps) {
  const form = useForm<SimulationSettingsFormValues>({
    resolver: zodResolver(StockSimulationSettingsSchema),
    defaultValues: {
      id: stock.id,
      volatility: new Decimal(stock.volatility).toNumber(),
      jumpProbability: new Decimal(stock.jumpProbability).toNumber(),
      maxJumpMultiplier: new Decimal(stock.maxJumpMultiplier).toNumber(),
      priceCap: stock.priceCap ? new Decimal(stock.priceCap).toNumber() : null,
      priceChangeDisabled: Boolean(stock.priceChangeDisabled),
    },
  });

  const updateSettingsMutation =
    api.admin.updateStockSimulationSettings.useMutation({
      onSuccess: (updatedStock) => {
        toast.success(
          `Simulation settings for ${updatedStock.symbol} updated.`,
        );
        // Reset form with new default values from the updated stock
        form.reset({
          id: updatedStock.id,
          volatility: new Decimal(updatedStock.volatility).toNumber(),
          jumpProbability: new Decimal(updatedStock.jumpProbability).toNumber(),
          maxJumpMultiplier: new Decimal(
            updatedStock.maxJumpMultiplier,
          ).toNumber(),
          priceCap: updatedStock.priceCap
            ? new Decimal(updatedStock.priceCap).toNumber()
            : null,
          priceChangeDisabled: updatedStock.priceChangeDisabled,
        });
        onSuccess?.(); // Call the optional success callback
      },
      onError: (error) => {
        toast.error(`Failed to update settings: ${error.message}`);
      },
    });

  function onSubmit(values: SimulationSettingsFormValues) {
    // Ensure priceCap is sent as null if empty string or 0 (adjust if 0 is valid)
    const dataToSend = {
      ...values,
      priceCap:
        values.priceCap === null || values.priceCap === 0
          ? null
          : values.priceCap,
    };
    updateSettingsMutation.mutate(dataToSend);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulation Parameters</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="volatility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Volatility</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.001" {...field} />
                    </FormControl>
                    <FormDescription>
                      Daily volatility (e.g., 0.02 for 2%). Range: 0.0001 -
                      0.9999.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jumpProbability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jump Probability</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.001" {...field} />
                    </FormControl>
                    <FormDescription>
                      Daily chance of a price jump. Range: 0.0001 - 0.9999.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxJumpMultiplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Jump Multiplier</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormDescription>
                      Max jump size (e.g., 1.10 for +/- 10%). Range: 1.0001 -
                      2.0.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priceCap"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Cap (Optional)</FormLabel>
                    <FormControl>
                      {/* Handle null value correctly */}
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(
                            value === "" ? null : parseFloat(value),
                          );
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum allowed price during simulation.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="priceChangeDisabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Disable Price Changes
                    </FormLabel>
                    <FormDescription>
                      Prevent the simulation from changing this stock&apos;s
                      price.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={updateSettingsMutation.isPending}>
              {updateSettingsMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Simulation Settings
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
