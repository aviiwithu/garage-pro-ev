
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Branch } from "@/lib/branch-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const getStatusVariant = (status: string) => (status === 'Active' ? 'default' : 'secondary');

export const columns: ColumnDef<Branch>[] = [
  {
    accessorKey: "branchCode",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Branch Code
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Branch Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    ),
  },
  {
    accessorKey: "location",
    header: "Location",
  },
  {
    accessorKey: "manager",
    header: "Branch Manager",
  },
  {
    accessorKey: "contact",
    header: "Contact",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge variant={getStatusVariant(row.original.status)}>{row.original.status}</Badge>,
  },
  // {
  //   id: "actions",
  //   cell: ({ row }) => {
  //     const branch = row.original
  //     return (
  //       <DropdownMenu>
  //         <DropdownMenuTrigger asChild>
  //           <Button variant="ghost" className="h-8 w-8 p-0">
  //             <span className="sr-only">Open menu</span>
  //             <MoreVertical className="h-4 w-4" />
  //           </Button>
  //         </DropdownMenuTrigger>
  //         <DropdownMenuContent align="end">
  //           <DropdownMenuItem>Edit</DropdownMenuItem>
  //           <DropdownMenuItem>Deactivate</DropdownMenuItem>
  //         </DropdownMenuContent>
  //       </DropdownMenu>
  //     )
  //   },
  // },
]
