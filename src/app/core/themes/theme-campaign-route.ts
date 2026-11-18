export function themeCampaignId(value: string | null): string | null {
  return value && /^[a-z0-9][a-z0-9-]{0,35}$/.test(value) ? value : null;
}
