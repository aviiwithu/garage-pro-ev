
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EditUserForm } from './edit-user-form';

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
};

export function EditUserDialog({ user, isOpen, onOpenChange }: { user: User; isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update the details for {user.name}.
          </DialogDescription>
        </DialogHeader>
        <EditUserForm user={user} onUserUpdated={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
