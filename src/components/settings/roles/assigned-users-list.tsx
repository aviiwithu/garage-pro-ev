
'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

export function AssignedUsersList({ roleId }: { roleId: string }) {
  // Fetch users for the given roleId
  const users = [
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Admin' },
  ];

  // Fetch all available roles
  const allRoles = [
    { id: '1', name: 'Admin' },
    { id: '2', name: 'Technician' },
    { id: '3', name: 'Customer Support' },
  ];

  return (
    <Card>
      <CardContent className='pt-6'>
        <ul className="divide-y">
          {users.map(user => (
            <li key={user.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <Select defaultValue={roleId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
