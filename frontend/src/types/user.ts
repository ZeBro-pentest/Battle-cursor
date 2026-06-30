export interface Cursor {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  debuffs: string[];
  rarity: string;
}

export interface Canvas {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  protections: string[];
  rarity: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  rating: number;
  coins: number;
  cursor: Cursor | null;
  canvas: Canvas | null;
  is_verified: boolean;
  profile_drawing_url: string | null;
}

export interface Inventory {
  id: string;
  cursors: Cursor[];
  canvases: Canvas[];
}
