// This interface represents the return type from the portfolioHistory API
export interface PortfolioHistoryPoint {
  date: string;
  value: number;
}

// This interface could be used if you decide to store portfolio history in the database
export interface PortfolioHistory {
  id: string;
  portfolioId: string;
  date: string;
  value: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Plan {
  id: string;
  priceId: string;
  title: string;
  description: string;
  price: string;
  features: string[];
  cta: string;
  period?: string;
  popular?: boolean;
}

export interface PlansData {
  oneTime: Plan[];
  monthly: Plan[];
  annual: Plan[];
}
