export type OriginalReport = {registrations?:number|null; revenue?:number|null; roi?:number|null; comment?:string|null};
export type Channel = {
  channel:string|null; contacts:number; web_registered:number; unregistered:number; paid:number; revenue:number;
  conversion:number|null; assumed_contacts:number; budget_visible:boolean; budget:number|null; roi:number|null;
  cpa_lead:number|null; cpa_paid:number|null; cpa_active:number|null; clicks:number|null; ctr:number|null;
  active_candidates_assumed:number|null; is_assumed:boolean|null; data_note:string|null; original_report?:OriginalReport|null;
};
export type Summary = {
  kpi:{contacts:number;web_registered:number;paid:number;revenue:number;budget:number|null;roi_program:number|null;roi_paid_channels:number|null;cpa_paid:number|null};
  channels:Channel[]; filtered:boolean;
};
export const groups = [['board','Bảng thi'],['region','Miền']] as const;
export type GroupKey = typeof groups[number][0];
export type Filters = Partial<Record<GroupKey|'date_from'|'date_to',string>>;
export type Options = Record<GroupKey,string[]>;
export type OptionsResponse = {viewing_partner:string|null;contacts?:Options};
export const labelFor=(row:Channel)=>row.channel || 'Chưa xác định';
export function budgeted(rows:readonly Channel[]) {return rows.filter(row=>row.budget_visible);}
export function reconciliationRows(rows:readonly Channel[]) {return budgeted(rows).filter(row=>row.original_report!=null);}
export function conversionValid(row:Channel) {
  return [row.contacts,row.web_registered,row.paid,row.unregistered].every(n=>Number.isSafeInteger(n)&&n>=0)
    && row.contacts>=row.web_registered && row.web_registered>=row.paid && row.contacts-row.web_registered===row.unregistered;
}

