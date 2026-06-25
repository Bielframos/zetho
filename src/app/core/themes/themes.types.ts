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
