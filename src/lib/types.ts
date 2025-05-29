export interface User {
  id: string;
  email: string;
  role: 'investor' | 'analyst';
  credits: number;
  created_at: string;
  phone_number?: string;
}

export interface Deal {
  id: string;
  address: string;
  investor_id: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  created_at: string;
  deleted_at: string | null;
  analyst_score?: number;
  auto_score?: number;
  executive_summary?: string;
  time_spent?: number;
  is_priority?: boolean;
  messages?: { count: number }[];
  documents?: { count: number }[];
  sections?: DealSection[];
}

export interface DealSection {
  id: string;
  deal_id: string;
  type: string;
  data: Record<string, unknown>;
  completed: boolean;
  updated_at: string;
}

export interface CreditWallet {
  id: string;
  user_id: string;
  credits: number;
  tier: 'basic' | 'pro' | 'enterprise';
  rollover_credits: number;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'purchase' | 'debit' | 'refund';
  payment_intent_id?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface Message {
  id: string;
  deal_id: string;
  user_id: string;
  content: string;
  created_at: string;
  sender?: {
    email: string;
    name: string;
  };
}

export interface Document {
  id: string;
  deal_id: string;
  name: string;
  url: string;
  uploaded_at: string;
  version: number;
  replaced_by?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  deal_id?: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface ContractorSubmission {
  id: string;
  deal_id: string;
  contractor_id: string;
  fields_filled: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface DealScore {
  cashFlow: number; // 15 points
  appreciation: number; // 10 points
  arvVsPurchase: number; // 10 points
  locationQuality: number; // 10 points
  rentDemand: number; // 10 points
  rehabComplexity: number; // 10 points
  financingReadiness: number; // 10 points
  exitStrategies: number; // 10 points
  tenantProfile: number; // 5 points
  propertyType: number; // 5 points
  total: number; // 100 points total
}