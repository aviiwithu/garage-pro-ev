
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Complaint, ComplaintStatus } from "@/lib/complaint-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from 'date-fns';

const statusConfig: Record<ComplaintStatus, { color: string }> = {
    'Open': { color: 'bg-red-500' },
    'Technician Assigned': { color: 'bg-orange-500' },
    'Estimate Shared': { color: 'bg-yellow-500 text-black' },
    'Estimate Approved': { color: 'bg-blue-500' },
    'In Progress': { color: 'bg-purple-500' },
    'Resolved': { color: 'bg-green-500' },
    'Closed': { color: 'bg-gray-500' },
}

export const columns: ColumnDef<Complaint>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
        const id: string = row.getValue("id")
        return <div className="font-medium">{id}</div>
    }
  },
  {
    accessorKey: "issue",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
    },
    cell: ({ row }) => {
        return <div className="text-left">{row.original.issue}</div>
    }
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
    },
    cell: ({ row }) => {
        const status: ComplaintStatus = row.getValue("status")
        const config = statusConfig[status]
        return <Badge className={config?.color}>{status}</Badge>
    }
  },
  {
    accessorKey: "priority",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Priority
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
    },
    cell: ({ row }) => {
        const complaint = row.original as any;
        return <div>{complaint.priority || 'N/A'}</div>
    }
  },
    {
    accessorKey: "resolutionType",
    header: "Resolution",
    cell: ({ row }) => {
        const complaint = row.original as any;
        return <div>{complaint.resolutionType || 'N/A'}</div>
    }
  },
   {
    accessorKey: "assignedTo",
    header: "Technician",
  },
   {
    accessorKey: "createdAt",
    header: "Submitted",
    cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"))
        return <div>{format(date, "PPP")}</div>
    }
  },
   {
    id: "actions",
    cell: ({ row, table }) => {
      const complaint = row.original
 
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
                onClick={() => (table.options.meta as any)?.onRowClick(complaint)}
            >
              Open Job Card
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(complaint.id)}
            >
              Copy ticket ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
