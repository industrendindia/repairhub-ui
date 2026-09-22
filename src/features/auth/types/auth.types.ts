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
    website?: string | null;
    deliveryGalleryEnabled?: boolean;
    itemsLabel?: string | null;
    itemLabel?: string | null;
    categoryLabel?: string | null;
    categoryOptions?: string | null;
    maintenanceLabel?: string | null;
    staffLabel?: string | null;
    jobCardLabel?: string | null;
    inProgressLabel?: string | null;
    completedLabel?: string | null;
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
