import test from 'node:test';
import assert from 'node:assert/strict';
import { getRolePermissions, getRoleBadgeLabel } from './auth-permissions';

test('pramuniaga permissions are restricted to POS and view catalog without cost prices or void', () => {
  const perm = getRolePermissions('pramuniaga');
  assert.equal(perm.canAccessPos, true);
  assert.equal(perm.canViewCatalog, true);
  assert.equal(perm.canViewCostPrice, false);
  assert.equal(perm.canEditInventory, false);
  assert.equal(perm.canAdjustStock, false);
  assert.equal(perm.canManageCategoriesAndSuppliers, false);
  assert.equal(perm.canVoidTransactions, false);
  assert.equal(perm.canManageSettings, false);
  assert.equal(perm.canManageUsers, false);
  assert.equal(perm.canViewFinancialOmzet, false);
});

test('admin permissions include inventory CRUD, suppliers, and void, but exclude user management', () => {
  const perm = getRolePermissions('admin');
  assert.equal(perm.canAccessPos, true);
  assert.equal(perm.canViewCatalog, true);
  assert.equal(perm.canViewCostPrice, true);
  assert.equal(perm.canEditInventory, true);
  assert.equal(perm.canAdjustStock, true);
  assert.equal(perm.canManageCategoriesAndSuppliers, true);
  assert.equal(perm.canVoidTransactions, true);
  assert.equal(perm.canManageSettings, true);
  assert.equal(perm.canManageUsers, false);
  assert.equal(perm.canViewFinancialOmzet, true);
});

test('manager owner has full access across all operations', () => {
  const perm = getRolePermissions('manager');
  assert.equal(perm.canAccessPos, true);
  assert.equal(perm.canViewCostPrice, true);
  assert.equal(perm.canEditInventory, true);
  assert.equal(perm.canManageCategoriesAndSuppliers, true);
  assert.equal(perm.canVoidTransactions, true);
  assert.equal(perm.canManageUsers, true);
  assert.equal(perm.canViewFinancialOmzet, true);
});

test('role badge labels return appropriate Indonesian role descriptors', () => {
  assert.equal(getRoleBadgeLabel('manager'), 'MANAGER (OWNER)');
  assert.equal(getRoleBadgeLabel('admin'), 'ADMIN TOKO');
  assert.equal(getRoleBadgeLabel('pramuniaga'), 'PRAMUNIAGA (KASIR)');
});
