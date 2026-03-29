export interface CustomerRecord {
  id: string;
  businessId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerPayload {
  business_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  notes?: string;
}
