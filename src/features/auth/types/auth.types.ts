export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  company?: {
    id: string;
    name: string;
    logoUrl: string | null;
    invoiceHeaderText?: string | null;
    address?: string | null;
    mobile?: string | null;
    email?: string | null;
    gstNumber?: string | null;
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
