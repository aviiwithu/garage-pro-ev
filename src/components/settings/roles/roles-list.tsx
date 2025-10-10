
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export function RolesList() {
  // Fetch roles from your data source
  const roles = [
    { id: '1', name: 'Admin' },
    { id: '2', name: 'Technician' },
    { id: '3', name: 'Customer Support' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Roles</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {roles.map(role => (
            <li key={role.id}>
              <Link href={`/settings/roles/${role.id}`} className="block py-3 px-4 hover:bg-muted">
                {role.name}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
