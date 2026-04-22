import type { GroceryLineItem, WeekPlan } from "@/lib/planner/types";

export type GroceryProviderId = "walmart";

export type GroceryProviderInput = {
  userId: string;
  plan: WeekPlan;
};

export type GroceryProviderResult = {
  provider: GroceryProviderId;
  cartUrl: string | null;
  estimatedTotalCents: number;
  items: GroceryLineItem[];
};

export interface GroceryProvider {
  readonly id: GroceryProviderId;
  buildList(input: GroceryProviderInput): Promise<GroceryProviderResult>;
}
