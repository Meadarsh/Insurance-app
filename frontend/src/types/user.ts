export interface UserSettings {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role?: string;
  settings?: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
  };
  [key: string]: any;
}
