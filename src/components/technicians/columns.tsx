
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Technician } from "@/lib/technician-data"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "../ui/badge"

declare module '@tanstack/react-table' {
  interface TableMeta<TData> {
    viewTechnician: (technician: Technician) => void
    editTechnician: (technician: Technician) => void
    removeTechnician: (technician: Technician) => void
  }
}

const calculateNetSalary = (tech: Technician) => {
    if (!tech.salaryStructure) return 0;
    const totalEarnings = (tech.salaryStructure.basic || 0) + (tech.salaryStructure.hra || 0) + (tech.salaryStructure.allowances?.reduce((acc, curr) => acc + curr.amount, 0) || 0);
    const totalDeductions = tech.salaryStructure.deductions?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
    return totalEarnings - totalDeductions;
};

export const columns: ColumnDef<Technician & { activeTickets: number }>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "specialization",
    header: "Specialization",
    cell: ({ row }) => <Badge variant="secondary">{row.original.specialization}</Badge>,
  },
  {
    accessorKey: "salaryStructure",
    header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Net Salary
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    ),
    cell: ({ row }) => {
        const netSalary = calculateNetSalary(row.original);
        return <div className="font-code">₹{netSalary.toLocaleString()}</div>
    },
    sortingFn: (rowA, rowB) => {
        const netA = calculateNetSalary(rowA.original);
        const netB = calculateNetSalary(rowB.original);
        return netA - netB;
    }
  },
  {
    accessorKey: "activeTickets",
    header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Active Tickets
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    ),
    cell: ({ row }) => <div className="text-center">{row.original.activeTickets}</div>
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const technician = row.original;
      return (
        <DropdownMenu modal={false} >
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"><MoreVertical /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => table.options.meta?.viewTechnician(technician)}>
                    View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => table.options.meta?.editTechnician(technician)}>
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => table.options.meta?.removeTechnician(technician)}>
                    Remove
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
