export type UserRole = 'operator' | 'user';

export type UserStatus = 'active' | 'blocked';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLogin: string;
  isOnline: boolean;
  password?: string;
  department?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  category: 'auth' | 'task' | 'system';
  timestamp: string;
  details?: string;
}
