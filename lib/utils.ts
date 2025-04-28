import { clsx, type ClassValue } from "clsx";
import Decimal from "decimal.js";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (
  value: number | Decimal | null | undefined,
): string => {
  if (value === null || value === undefined) return "-";
  const numValue = value instanceof Decimal ? value.toNumber() : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

export const formatNumber = (
  value: number | Decimal | null | undefined,
): string => {
  if (value === null || value === undefined) return "-";

  // Convert Decimal to number if necessary
  const numValue = value instanceof Decimal ? value.toNumber() : value;

  if (numValue === 0) return "0";

  const absValue = Math.abs(numValue);
  const sign = numValue < 0 ? "-" : "";

  const thresholds = [
    { value: 1e12, suffix: "T" },
    { value: 1e9, suffix: "B" },
    { value: 1e6, suffix: "M" },
    { value: 1e3, suffix: "K" },
  ];

  for (const threshold of thresholds) {
    if (absValue >= threshold.value) {
      const formattedValue = (absValue / threshold.value).toFixed(1);
      // Remove trailing '.0'
      const displayValue = formattedValue.endsWith(".0")
        ? formattedValue.slice(0, -2)
        : formattedValue;
      return `${sign}${displayValue}${threshold.suffix}`;
    }
  }

  // For numbers less than 1000, just return the number as a string
  // Optionally use toLocaleString() for commas: numValue.toLocaleString("en-US")
  return `${sign}${absValue.toString()}`;
};

// Helper function to calculate price change (similar to MarketTable)
export const calculatePriceChange = (
  currentPriceInput: Decimal | number | string,
  previousCloseInput: Decimal | number | string | null | undefined,
): Decimal => {
  const currentPrice = new Decimal(currentPriceInput);
  const previousCloseValue = previousCloseInput ?? 0;
  const previousClose = new Decimal(previousCloseValue);

  if (previousClose.isZero()) {
    return new Decimal(0);
  }
  // Calculate percentage change
  return currentPrice.minus(previousClose).dividedBy(previousClose).times(100);
};

// Helper function to calculate change and percentage
export const calculateChange = (
  current: Decimal,
  previous: Decimal | null | undefined,
) => {
  const prev = previous ?? current;
  if (prev.isZero()) {
    return {
      change: new Decimal(0),
      percent: new Decimal(0),
      isPositive: true,
    };
  }
  const change = current.minus(prev);
  const percent = change.dividedBy(prev).times(100);
  return { change, percent, isPositive: change.gte(0) };
};

/**
 * Formats a number as a percentage string.
 * @param value - The number (e.g., 0.05 for 5%).
 * @param options - Formatting options.
 * @param options.minimumFractionDigits - Minimum decimal places.
 * @param options.maximumFractionDigits - Maximum decimal places.
 * @param options.addPrefix - Whether to add '+' for positive numbers.
 * @returns Formatted percentage string.
 */
export function formatPercentage(
  value: number | null | undefined,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    addPrefix?: boolean;
  } = {},
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "-"; // Or however you want to display null/NaN
  }

  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    addPrefix = false,
  } = options;

  const prefix = addPrefix && value > 0 ? "+" : "";

  return `${prefix}${(value * 100).toLocaleString(undefined, {
    minimumFractionDigits,
    maximumFractionDigits,
  })}%`;
}
