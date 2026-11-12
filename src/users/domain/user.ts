export interface User {
  id: number;
  login: string;
  email: string;
  passwordHash: string;
  age: number;
  description: string;
  createdAt: Date;
  refreshTokenHash: string | null;
  deletedAt: Date | null;
}

export interface CreateUserData {
  login: string;
  email: string;
  passwordHash: string;
  age: number;
  description: string;
  refreshTokenHash: string | null;
}

export type PublicProfile = Pick<User, 'id' | 'login' | 'age' | 'description'>;

export type OwnProfile = Pick<User, 'login' | 'email' | 'age' | 'description'>;

export type UpdateProfileData = Partial<
  Pick<User, 'login' | 'email' | 'age' | 'description'>
>;
