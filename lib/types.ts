export type Platform = "Uber" | "99";

export type ExpenseCategory =
  | "Combustível"
  | "Manutenção"
  | "Seguro"
  | "Alimentação"
  | "Lavagem"
  | "IPVA/Licenciamento"
  | "Outros";

export interface Trip {
  id: string;
  platform: Platform;
  grossValue: number;
  date: string;
  durationMinutes?: number;
  distanceKm?: number;
  notes?: string;
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  value: number;
  date: string;
  description?: string;
}

export const PLATFORMS: Platform[] = ["Uber", "99"];

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Combustível",
  "Manutenção",
  "Seguro",
  "Alimentação",
  "Lavagem",
  "IPVA/Licenciamento",
  "Outros",
];
