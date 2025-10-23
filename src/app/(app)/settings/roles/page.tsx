
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { RolesList } from '@/components/settings/roles/roles-list';

export default function RolesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title="Roles"
        description="Manage user roles and permissions."
        showBackButton
      />
      <RolesList />
    </div>
  );
}
