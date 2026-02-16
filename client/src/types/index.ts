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
  producer?: string | null;
  vintage: number | null;
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
