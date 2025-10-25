
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { RoleDetails } from '@/components/settings/roles/role-details';
import { AssignedUsersList } from '@/components/settings/roles/assigned-users-list';

export default function RoleDetailsPage({ params }: { params: any }) {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title="Role Details"
        description="Edit role details and manage assigned users."
        showBackButton
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-bold mb-4">Edit Role</h2>
          <RoleDetails roleId={params.roleId} />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4">Assigned Users</h2>
          <AssignedUsersList roleId={params.roleId} />
        </div>
      </div>
    </div>
  );
}
