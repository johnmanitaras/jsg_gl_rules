export interface GroupInfo {
  id: string;
  name: string;
}

export interface TenantInfo {
  id: string;
  name: string;
}

export interface UserClaims {
  tenant: TenantInfo;
  groups: GroupInfo[];
  permissions: string[];
  user_id: string;
  email: string;
  email_verified: boolean;
}