
"use client"

import { ColumnDef, Row, Table } from "@tanstack/react-table"
import { InventoryPart } from "@/lib/inventory-data"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "../ui/badge"

// This type is used to extend the table meta with our custom functions
declare module '@tanstack/react-table' {
  interface TableMeta<TData> {
    editPart: (part: InventoryPart) => void
    adjustStock?: (part: InventoryPart) => void;
  }

}

export const partsColumns: ColumnDef<InventoryPart>[] = [
   {
    accessorKey: "id",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Id <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
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
  },
  {
    accessorKey: "hsnSacCode",
    header: "HSN/SAC",
  },
   {
    accessorKey: "price",
    header: "Selling Price",
    cell: ({ row }) => `INR ₹${row.original.price.toFixed(2)}`,
  },
  {
    accessorKey: "stock",
    header: "Stock on Hand",
  },
  {
    accessorKey: "itemType",
    header: "Item Type",
    cell: ({ row }) => <Badge variant="outline">{row.original.category || 'NA'}</Badge>
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const part = row.original;
      return (
        <DropdownMenu modal={false} >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreVertical /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => table.options.meta?.editPart(part)}>
              Edit
            </DropdownMenuItem>
           <DropdownMenuItem onClick={() => table.options.meta?.adjustStock?.(part)}>
              Adjust Stock
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
]
