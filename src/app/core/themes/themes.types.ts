export type ProfileThemeType = 'color' | 'game';

export interface ProfileTheme {
  $id: string;
  name: string;
  type: ProfileThemeType;
  price: number;
  backgroundImageId?: string;
  backgroundColor?: string;
  primaryColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  gameId?: string;
}

export interface CreateThemePayload {
  name: string;
  type: ProfileThemeType;
  price: number;
  backgroundImageId?: string;
  backgroundColor?: string;
  primaryColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  gameId?: string;
}

export interface SpecialTheme {
  id: string;
  name: string;
  appearance: string;
}

export interface ThemeCampaign extends SpecialTheme {
  startsAt: string;
  endsAt: string;
  serverTime: string;
  status: 'upcoming' | 'open' | 'ended';
}
