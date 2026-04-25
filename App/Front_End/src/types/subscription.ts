// Front_End/src/types/subscription.ts

export interface Subscription {
  hasSubscription: boolean;
  plan: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  trialEnd?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

export interface Plan {
  code: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly?: number;
  features: string[];
}

export interface Invoice {
  id: string;
  stripe_invoice_id?: string;
  stripe_invoice_number?: string;
  amount_paid?: number;
  amount?: number;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  created_at: string;
  invoice_url?: string;
}

export interface Usage {
  current: {
    users: number;
    patients: number;
    todayAppointments: number;
  };
  limits: {
    max_users: number;
    max_patients: number;
    max_appointments_per_day?: number;
  };
}

export interface PaymentGateway {
  id: string;
  name: string;
  configured: boolean;
  enabled: boolean;
}

export interface Revenue {
  mrr: number;
  total: number;
  periodRevenue: number;
  newSubscriptions: number;
  churnRate: number;
}

export interface Clinic {
  id: string;
  name: string;
  email: string;
  plan_name?: string;
  subscription_status?: string;
  patient_count?: number;
  total_revenue?: number;
  created_at: string;
}

export interface SystemHealth {
  database: {
    sizeMB: number;
    connections: number;
  };
  uptime: number;
  memory: {
    usageMB: number;
  };
  environment: {
    nodeVersion: string;
    mode: string;
  };
}