export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  HomePage: undefined;
  MyCellar: { refresh?: number };
  Pairing: undefined;
  WineForm: { wine?: Wine } | undefined;
};

export type Wine = {
  id: string;
  name: string;
  country: string;
  region?: string | null;
  winery?: string | null;
  vintage: number | null;
  amount?: number | null;
  grapes?: string | null;
  type: string;
  imageUrl?: string | null;
  notes?: string | null;
  drinkWindow?: string | null;
  marketValue?: string | null;
};

export type WineTypeItem = {
  label: string;
  value: string;
  color: string;
};

export type ScannedWine = {
  name: string | null;
  country: string | null;
  region: string | null;
  winery: string | null;
  vintage: number | null;
  type: string | null;
  grapes: string | null;
};

export type WineInsights = {
  drinkWindow: string | null;
  marketValue: string | null;
};
