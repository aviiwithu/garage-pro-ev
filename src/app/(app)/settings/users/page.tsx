
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { UsersList } from '@/components/settings/users/users-list';
import { AddUserDialog } from '@/components/settings/users/add-user-dialog';

export default function UsersPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title="Users"
        description="Manage users and their roles."
        showBackButton
      >
        <AddUserDialog />
      </PageHeader>
      <UsersList />
    </div>
  );
}
