
"use client"

import { ColumnDef, TableMeta } from "@tanstack/react-table"

declare module '@tanstack/table-core' {
  interface TableMeta<TData> {
    editService: (service: ServiceItem) => void
  }
}
import { ServiceItem } from "@/lib/inventory-data"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "../ui/badge"

export const servicesColumns: ColumnDef<ServiceItem>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Item Name <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
      accessorKey: "partNumber",
      header: "SKU",
      cell: () => 'N/A'
  },
  {
    accessorKey: "hsnSacCode",
    header: "HSN/SAC",
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Selling Price <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div>
        <span className="font-code">INR </span>
        <span className="font-code">₹</span><span className="font-code">{row.original.price.toFixed(2)}</span>
      </div>
    ),
  },
   {
      accessorKey: "stock",
      header: "Stock on Hand",
      cell: () => 'N/A'
  },
  {
      accessorKey: "itemType",
      header: "Item Type",
      cell: () => <Badge variant="secondary">Service</Badge>
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"><MoreVertical /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => {
                  table.options.meta?.editService(row.original)
                }}>
                  Edit
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
