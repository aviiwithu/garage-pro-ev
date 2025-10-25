
"use client"

import { ColumnDef, TableMeta } from "@tanstack/react-table"
import { Customer } from "@/lib/customer-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

declare module '@tanstack/table-core' {
  interface TableMeta<TData> {
    viewCustomer?: (customer: Customer) => void
    editCustomer?: (customer: Customer) => void
    deleteCustomer?: (customer: Customer) => void
  }
}

export const columns: ColumnDef<Customer>[] = [
  {
    accessorFn: (row) => row.type === 'B2B' ? row.companyName : `${row.salutation??''} ${row.name}`,
    id: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Name <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant={row.original.type === 'B2B' ? 'secondary' : 'default'}>
        {row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Email <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "vehicles",
    header: "Vehicles",
    cell: ({ row }) => Array.isArray(row.original.vehicles) ? row.original.vehicles.join(', ') : '',
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const customer = row.original
      return (
        <DropdownMenu modal={false} >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreVertical /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => table.options.meta?.viewCustomer?.(customer)}>
                View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => table.options.meta?.editCustomer?.(customer)}>
                Edit Customer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => table.options.meta?.deleteCustomer?.(customer)} className="text-destructive">
                Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
