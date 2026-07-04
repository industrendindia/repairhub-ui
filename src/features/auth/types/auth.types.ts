export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  company?: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

export type LoginPayload = {
  username: string;
  password: string;
};
