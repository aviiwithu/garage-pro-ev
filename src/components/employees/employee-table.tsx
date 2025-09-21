

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Employee } from '@/context/EmployeeContext';
import { format } from 'date-fns';
import { Technician } from '@/lib/technician-data';

export function EmployeeTable({ employees }: { employees: Employee[] }) {

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Employees</CardTitle>
        <CardDescription>A unified list of all staff members.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
            <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {employees.map((employee) => {
                    const isTechnician = 'title' in employee; // Use a field that is specific to your detailed employee/technician type
                    return (
                        <TableRow key={employee.id}>
                            <TableCell>{isTechnician && (employee as Technician).employeeId ? (employee as Technician).employeeId : 'N/A'}</TableCell>
                            <TableCell className="font-medium">{employee.name}</TableCell>
                            <TableCell>{employee.email}</TableCell>
                            <TableCell>{isTechnician && (employee as Technician).phone ? (employee as Technician).phone : 'N/A'}</TableCell>
                            <TableCell>{isTechnician && (employee as Technician).department ? (employee as Technician).department : 'N/A'}</TableCell>
                            <TableCell>{isTechnician && (employee as Technician).manager ? (employee as Technician).manager : 'N/A'}</TableCell>
                            <TableCell>{isTechnician && (employee as Technician).gender ? (employee as Technician).gender : 'N/A'}</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem>View Details</DropdownMenuItem>
                                        <DropdownMenuItem>Edit</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )
                })}
                {employees.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center">No employees found.</TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
