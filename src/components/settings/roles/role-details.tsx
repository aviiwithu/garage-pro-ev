
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export function RoleDetails({ roleId }: { roleId: string }) {
  // Fetch role details based on roleId
  const role = { id: roleId, name: 'Admin' }; // Replace with actual data fetching

  return (
    <Card>
      <CardContent className="pt-6">
        <form className="space-y-4">
          <div>
            <Label htmlFor="role-name">Role Name</Label>
            <Input id="role-name" defaultValue={role.name} />
          </div>
          <Button type="submit">Save Changes</Button>
        </form>
      </CardContent>
    </Card>
  );
}
