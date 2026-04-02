export type OrganizerBillingData = {
  organizer: {
    plan: string;
    earlybird_eligible?: boolean;
    full_feature_trial_end_at?: string | null;
    founder30_granted_at?: string | null;
    founder30_end_at?: string | null;
    subscription_status?: string | null;
    stripe_status?: string | null;
    current_period_end?: string | null;
    manual_grant_active?: boolean | null;
    manual_grant_expires_at?: string | null;
    stripe_account_charges_enabled?: boolean;
    stripe_account_details_submitted?: boolean;
  };
  monthlyPublished: number;
  publishLimit: number | null;
};
