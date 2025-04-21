"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type * as z from "zod";
import { api } from "@/trpc/react";
import { stockUpdateSchema } from "@/schemas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Stock } from "@prisma/client"; // Import Stock type

interface StockEditDialogProps {
  stock: Stock;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void; // Callback after successful update
}

type StockUpdateFormValues = z.infer<typeof stockUpdateSchema>;

export function StockEditDialog({
  stock,
  open,
  onClose,
  onSuccess,
}: StockEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<StockUpdateFormValues>({
    resolver: zodResolver(stockUpdateSchema),
    defaultValues: {
      id: stock.id,
      name: stock.name,
      sector: stock.sector ?? "", // Handle null
      currentPrice: Number(stock.currentPrice), // Convert Decimal to number
      previousClose: stock.previousClose
        ? Number(stock.previousClose)
        : undefined, // Handle null/Decimal
      volume: stock.volume,
      marketCap: stock.marketCap ? Number(stock.marketCap) : undefined, // Handle null/Decimal
      isActive: stock.isActive,
      isFrozen: stock.isFrozen,
      // Add other fields from stockUpdateSchema if needed
    },
  });

  // Reset form when stock prop changes or dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset({
        id: stock.id,
        name: stock.name,
        sector: stock.sector ?? "",
        currentPrice: Number(stock.currentPrice),
        previousClose: stock.previousClose
          ? Number(stock.previousClose)
          : undefined,
        volume: stock.volume,
        marketCap: stock.marketCap ? Number(stock.marketCap) : undefined,
        isActive: stock.isActive,
        isFrozen: stock.isFrozen,
      });
    }
  }, [stock, open, form]);

  const updateStockMutation = api.stockAdmin.updateStock.useMutation({
    onSuccess: () => {
      toast.success(`Stock ${stock.symbol} updated successfully.`);
      onSuccess(); // Call the success callback (e.g., invalidate query, close dialog)
    },
    onError: (error) => {
      toast.error(`Failed to update stock: ${error.message}`);
      setIsSubmitting(false);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (values: StockUpdateFormValues) => {
    setIsSubmitting(true);
    // Ensure ID is included, which it should be from defaultValues/reset
    updateStockMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Stock: {stock.symbol}</DialogTitle>
          <DialogDescription>
            Make changes to the stock details. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Hidden ID field - already included in schema/values */}
            {/* <FormField control={form.control} name="id" render={() => <FormItem />} /> */}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Apple Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sector"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sector (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Technology"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Price</FormLabel>
                  <FormControl>
                    {/* Use type="number" and step for better UX */}
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="previousClose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Previous Close (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="volume"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Volume</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="marketCap"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Market Cap (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center space-x-4">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="mr-4 space-y-0.5">
                      <FormLabel>Active</FormLabel>
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
              <FormField
                control={form.control}
                name="isFrozen"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="mr-4 space-y-0.5">
                      <FormLabel>Frozen</FormLabel>
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
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
