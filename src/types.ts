export type TrialStatus = 'active' | 'passive' | 'expiring' | 'converted' | 'expired';

export interface Contact {
  id: string;
  name: string;
  email: string;
  trialStartDate: string;
  trialEndDate: string;
  status: TrialStatus;
  engagementScore: number; // 0-100
  lastLogin: string;
  emailsOpened: number;
  clicks: number;
  potentialRevenue: number;
  discountOffered?: {
    code: string;
    amount: number;
    date: string;
  };
}

export interface DashboardStats {
  totalTrialUsers: number;
  passiveUsers: number;
  conversionRate: number;
  potentialRevenue: number;
}
