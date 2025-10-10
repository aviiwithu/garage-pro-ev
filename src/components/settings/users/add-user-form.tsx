
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const roles = [
  { id: '1', name: 'ADMIN' },
  { id: '2', name: 'TECHNICIAN' },
  { id: '3', name: 'CUSTOMER' },
  { id: '4', name: 'MANAGER' },
];

export function AddUserForm({ onUserAdded }: { onUserAdded: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, 'password'); // Set a default password

      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        phone,
        role,
        avatar: '', // Set a default avatar
      });

      onUserAdded();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="role">Role</Label>
        <Select onValueChange={setRole}>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map(role => (
              <SelectItem key={role.id} value={role.name}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end">
        <Button type="submit">Add User</Button>
      </div>
    </form>
  );
}
