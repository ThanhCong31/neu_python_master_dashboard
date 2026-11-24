export interface MarketingChannel {
  channel: string;
  contacts: number;
  web_registered: number;
  unregistered: number;
  paid: number;
  revenue: number;
  conversion: number | null;
  assumed_contacts: number;
  budget_visible: boolean;
  budget: number | null;
  roi: number | null;
  cpa_lead: number | null;
  cpa_paid: number | null;
  cpa_active: number | null;
  clicks: number | null;
  ctr: number | null;
  active_candidates_assumed: number | null;
  is_assumed: boolean | null;
  data_note: string | null;
}

export interface MarketingSummary {
  kpi: {
    contacts: number;
    web_registered: number;
    paid: number;
    revenue: number;
    budget: number | null;
    roi_program: number | null;
    roi_paid_channels: number | null;
    cpa_paid: number | null;
  };
  channels: MarketingChannel[];
  filtered: boolean;
}

export interface SponsorBenefit {
  item: string;
  status: string | null;
  progress: number | null;
  placement: string | null;
  schedule: string | null;
  note: string | null;
}

export interface MediaReach {
  channel: string;
  reach: number | null;
  engagement: number | null;
  engagement_rate: number | null;
  importance: number | null;
}

export interface SponsorshipSummary {
  benefits: SponsorBenefit[];
  reach: MediaReach[];
}
