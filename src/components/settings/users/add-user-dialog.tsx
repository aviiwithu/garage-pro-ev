
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddUserForm } from './add-user-form';

export function AddUserDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Add User</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add a New User</DialogTitle>
          <DialogDescription>
            Enter the details of the new user to add them to the system.
          </DialogDescription>
        </DialogHeader>
        <AddUserForm onUserAdded={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
