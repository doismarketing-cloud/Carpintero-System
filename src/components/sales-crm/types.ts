export interface CRMClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  company?: string;
  createdAt: string;
}

export type BudgetStatus = "approved" | "pending" | "unanswered" | "expired" | "completed";

export type CalculationMethod = 
  | "material_markup" 
  | "linear_meter" 
  | "sq_meter" 
  | "cu_meter" 
  | "material_hours_markup"
  | "hourly_rate"
  | "manual";

export interface BudgetItem {
  id: string;
  description: string;
  calculationMethod: CalculationMethod;
  
  // Dimensions for calculation
  length?: number; // in meters
  width?: number;  // in meters
  height?: number; // in meters
  quantity?: number; // quantity modifier
  
  // Price breakdown factors
  materialCost?: number;
  markupPercent?: number; // e.g., 40 for 40% markup
  productionHours?: number;
  hourlyRate?: number;
  
  // Unit prices
  linearMeterPrice?: number;
  sqMeterPrice?: number;
  cuMeterPrice?: number;
  manualPrice?: number;
  
  // Custom options (colors, edge banding, handles)
  options?: string;
  totalPrice: number;

  // Optional item flags
  isOptional?: boolean;
  isIncluded?: boolean; // client decision state
}

export interface BudgetRoom {
  id: string;
  name: string; // e.g., "Cocina", "Dormitorio"
  items: BudgetItem[];
}

export interface CRMBudget {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  status: BudgetStatus;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  expirationDate: string; // "YYYY-MM-DD" style
  paymentMethod: string; // e.g., "Efectivo", "Transferencia", "Cuotas"
  installments?: number; // Number of payments
  rooms: BudgetRoom[];
  totalPrice: number;
  notes?: string;
  contract?: CRMContract;
  assignedEmployeeId?: string;
  reminderSentDate?: string; // Track reminder notification dates
}

export interface CRMContract {
  id: string;
  budgetId: string;
  contractText: string;
  status: "draft" | "sent" | "signed";
  signedBy?: string;
  signedAt?: string;
  signatureDataUrl?: string;
  sentLink?: string;
}

export interface HourlyRateConfig {
  monthlyFixedCosts: number; // e.g., alquiler, servicios, etc.
  workingDaysPerMonth: number; // e.g., 20 days
  hoursPerDay: number; // e.g., 8 hours
  teamMembersCount: number; // e.g., 2 carpenters
  targetMonthlySalary: number; // e.g., desired payout per person
  desiredProfitMarginPercent: number; // e.g., 20% markup on hourly cost
  calculatedRatePerHour: number; // Output calculated rate
}

export interface CompanyConfig {
  name: string;
  logoUrl?: string;
  email: string;
  phone: string;
  address: string;
  taxNumber?: string;
  representative: string;
  termsAndConditions: string;
  primaryColor?: string; // e.g. "slate", "emerald", "blue", "indigo"
}

export interface TeamMember {
  id: string;
  name: string;
  role: "admin" | "seller" | "carpenter";
  email: string;
  active: boolean;
}

export interface SaleReminder {
  id: string;
  budgetId: string;
  budgetTitle: string;
  clientName: string;
  dueDate: string;
  message: string;
  isCompleted: boolean;
  createdAt: string;
}
