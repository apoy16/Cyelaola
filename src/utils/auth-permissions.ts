export type UserRole = 'pramuniaga' | 'admin' | 'manager';

export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  is_active: number;
}

export interface RolePermissions {
  canAccessPos: boolean;
  canViewCatalog: boolean;
  canEditInventory: boolean;
  canViewCostPrice: boolean;
  canAdjustStock: boolean;
  canManageCategoriesAndSuppliers: boolean;
  canViewAllTransactions: boolean;
  canVoidTransactions: boolean;
  canManageSettings: boolean;
  canManageUsers: boolean;
  canViewFinancialOmzet: boolean;
}

export function getRolePermissions(role: UserRole): RolePermissions {
  switch (role) {
    case 'manager':
      return {
        canAccessPos: true,
        canViewCatalog: true,
        canEditInventory: true,
        canViewCostPrice: true,
        canAdjustStock: true,
        canManageCategoriesAndSuppliers: true,
        canViewAllTransactions: true,
        canVoidTransactions: true,
        canManageSettings: true,
        canManageUsers: true,
        canViewFinancialOmzet: true,
      };
    case 'admin':
      return {
        canAccessPos: true,
        canViewCatalog: true,
        canEditInventory: true,
        canViewCostPrice: true,
        canAdjustStock: true,
        canManageCategoriesAndSuppliers: true,
        canViewAllTransactions: true,
        canVoidTransactions: true,
        canManageSettings: true,
        canManageUsers: false,
        canViewFinancialOmzet: true,
      };
    case 'pramuniaga':
    default:
      return {
        canAccessPos: true,
        canViewCatalog: true,
        canEditInventory: false,
        canViewCostPrice: false,
        canAdjustStock: false,
        canManageCategoriesAndSuppliers: false,
        canViewAllTransactions: false,
        canVoidTransactions: false,
        canManageSettings: false,
        canManageUsers: false,
        canViewFinancialOmzet: false,
      };
  }
}

export function getRoleBadgeLabel(role: UserRole): string {
  switch (role) {
    case 'manager':
      return 'MANAGER (OWNER)';
    case 'admin':
      return 'ADMIN TOKO';
    case 'pramuniaga':
      return 'PRAMUNIAGA (KASIR)';
    default:
      return 'PENGGUNA';
  }
}
