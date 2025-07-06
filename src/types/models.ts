// src/types/models.ts
export type UserRole = 'user' | 'admin' | 'super-admin';

export interface UserProfile {
  uid: string;
  email?: string; // Email can be optional depending on the Firebase provider
  name: string;
  bio: string;
  role: UserRole;
  createdAt: string;
}
