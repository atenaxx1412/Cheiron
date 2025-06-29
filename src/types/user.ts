export interface User {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'student';
}

export interface LoginResult {
  success: boolean;
  user: User;
  token: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
  lastActivity: string;
}