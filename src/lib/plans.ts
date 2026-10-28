export type PlanKey = "starter" | "growth" | "pro" | "enterprise";

export interface PlanDefinition {
  key: PlanKey;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  tillLimit: number | null;
  staffLimit: number | null;
  description: string;
  features: string[];
}

export const PLANS: Record<PlanKey, PlanDefinition> = {
  starter: {
    key: "starter",
    name: "Starter",
    monthlyPrice: 29,
    annualPrice: 290,
    tillLimit: 1,
    staffLimit: 3,
    description: "For single-counter cafés and small bars just getting started.",
    features: [
      "1 till / register",
      "Up to 3 staff accounts",
      "Inventory & stock tracking",
      "Daily sales reports",
    ],
  },
  growth: {
    key: "growth",
    name: "Growth",
    monthlyPrice: 69,
    annualPrice: 690,
    tillLimit: 3,
    staffLimit: 10,
    description: "For growing restaurants and bars running multiple tills.",
    features: [
      "Up to 3 tills / registers",
      "Up to 10 staff accounts",
      "Advanced inventory & low-stock alerts",
      "Shift & cash reconciliation",
      "Sales analytics by staff & till",
    ],
  },
  pro: {
    key: "pro",
    name: "Pro",
    monthlyPrice: 129,
    annualPrice: 1290,
    tillLimit: 10,
    staffLimit: 40,
    description: "For multi-location restaurant groups that need full control.",
    features: [
      "Up to 10 tills / registers",
      "Up to 40 staff accounts",
      "Manager & owner privilege tiers",
      "Full audit trail on every transaction",
      "Priority support",
    ],
  },
  enterprise: {
    key: "enterprise",
    name: "Enterprise",
    monthlyPrice: 299,
    annualPrice: 2990,
    tillLimit: null,
    staffLimit: null,
    description: "Unlimited scale for large hospitality groups and franchises.",
    features: [
      "Unlimited tills / registers",
      "Unlimited staff accounts",
      "Custom onboarding & training",
      "Dedicated account manager",
      "Custom reporting & data export",
    ],
  },
};

export const PLAN_LIST = Object.values(PLANS);

export function planLabel(plan: string) {
  return PLANS[plan as PlanKey]?.name ?? plan;
}
