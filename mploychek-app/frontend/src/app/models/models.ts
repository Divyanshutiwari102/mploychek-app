export interface User {
  id: string;
  userId: string;
  name: string;
  role: 'Admin' | 'General User';
  department: string;
  joinDate: string;
  status: 'Active' | 'Inactive';
}

export interface LoginRequest {
  userId: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface VerificationRecord {
  id: string;
  candidateName: string;
  company: string;
  verificationType: 'Employment' | 'Education' | 'Criminal' | 'Address';
  status: 'Verified' | 'Pending' | 'In Progress' | 'Failed';
  requestedBy: string;
  date: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface RecordsResponse {
  records: VerificationRecord[];
  total: number;
  role: string;
}

export interface CreateUserRequest {
  userId: string;
  password: string;
  name: string;
  role: 'Admin' | 'General User';
  department: string;
}
