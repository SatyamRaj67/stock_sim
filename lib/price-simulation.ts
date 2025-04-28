import { type Stock } from "@prisma/client"; // Import the Stock type from Prisma Client
import Decimal from "decimal.js";
import { addDays, startOfDay, subDays } from "date-fns";

// Define the structure of the output data points
export interface PriceHistoryDataPoint {
  stockId: string;
  timestamp: Date;
  price: Decimal; // Closing price for the day
  volume: number;
  wasJump: boolean;
  jumpPercentage: Decimal | null;
}

// Helper function for normally distributed random number (Box-Muller transform)
// Returns a value roughly between -3 and 3, centered around 0
function randomNormal() {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Generates simulated daily price history data for a given stock.
 *
 * @param stock The stock object containing simulation parameters (volatility, jumpProbability, etc.).
 * @param days The number of past days to generate data for.
 * @returns An array of PriceHistoryDataPoint objects.
 */
export function generatePriceHistoryData(
  stock: Stock,
  days: number,
): PriceHistoryDataPoint[] {
  if (days <= 0) {
    return [];
  }

  const historyData: PriceHistoryDataPoint[] = [];
  const today = startOfDay(new Date());
  const startDate = subDays(today, days);

  // --- Simulation Setup ---
  // Estimate a starting price 'days' ago (very rough, improve if needed)
  let currentPrice = stock.currentPrice.mul(
    new Decimal(
      1 +
        (Math.random() - 0.5) *
          stock.volatility.toNumber() *
          Math.sqrt(days) *
          0.5,
    ), // Rough estimate based on volatility
  );
  if (currentPrice.lessThan(0.01)) {
    currentPrice = new Decimal(0.01);
  }

  const dailyVolatility = stock.volatility; // Daily volatility from stock
  const jumpProb = stock.jumpProbability; // Daily jump probability
  const maxJumpMult = stock.maxJumpMultiplier; // Max jump size (e.g., 1.10 for +/- 10%)

  // --- Simulation Loop ---
  for (let i = 0; i < days; i++) {
    const timestamp = addDays(startDate, i);
    let dailyReturn = new Decimal(0);
    let wasJump = false;
    let jumpPercentage: Decimal | null = null;

    // 1. Check for Jump Event
    if (Math.random() < jumpProb.toNumber()) {
      wasJump = true;
      // Calculate jump size: random percentage up to (maxJumpMultiplier - 1) * 100%
      const jumpMagnitude = new Decimal(Math.random()) // Random factor 0 to 1
        .mul(maxJumpMult.sub(1)); // Scale by (max multiplier - 1)
      const jumpDirection = Math.random() < 0.5 ? -1 : 1; // Random direction
      dailyReturn = jumpMagnitude.mul(jumpDirection);
      jumpPercentage = dailyReturn.mul(100); // Store jump percentage
    } else {
      // 2. Normal Daily Volatility (Geometric Brownian Motion approximation)
      // Use randomNormal for a more realistic distribution of returns
      const normalRandom = randomNormal();
      dailyReturn = dailyVolatility.mul(normalRandom);
    }

    // 3. Calculate New Price
    // newPrice = currentPrice * (1 + dailyReturn)
    let newPrice = currentPrice.mul(Decimal.add(1, dailyReturn));

    // Ensure price doesn't go below minimum or above cap (if defined)
    if (newPrice.lessThan(0.01)) {
      newPrice = new Decimal(0.01);
    }
    if (stock.priceCap && newPrice.greaterThan(stock.priceCap)) {
      newPrice = stock.priceCap;
      // Optional: Adjust dailyReturn if capped? For simplicity, we don't here.
    }

    // 4. Simulate Volume
    // Base volume + extra volume based on return magnitude
    const baseVolume = Math.random() * 50000 + 1000; // Base random volume
    const volatilityVolume = Math.abs(dailyReturn.toNumber()) * 500000; // More volume on big moves
    const simulatedVolume = Math.floor(baseVolume + volatilityVolume);

    // 5. Store Data Point
    historyData.push({
      stockId: stock.id,
      timestamp: timestamp,
      price: newPrice,
      volume: simulatedVolume,
      wasJump: wasJump,
      jumpPercentage: jumpPercentage,
    });

    currentPrice = newPrice;
  }

  return historyData;
}
