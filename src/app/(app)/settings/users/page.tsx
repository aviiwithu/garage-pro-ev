
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { UsersList } from '@/components/settings/users/users-list';
import { AddUserDialog } from '@/components/settings/users/add-user-dialog';

export default function UsersPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard settings</p>
          <h1 className="text-2xl font-bold">Users</h1>
        </div>
        <AddUserDialog />
      </div>
      <UsersList />
    </div>
  );
}
