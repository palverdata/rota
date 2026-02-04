"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Plus,
  Download,
  Trash2,
  Loader2,
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/shadcn-io/status"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import { Proxy } from "@/lib/types"
import { toast } from "@/lib/toast"

export default function ProxiesPage() {
  const [data, setData] = React.useState<Proxy[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false)
  const [editingProxy, setEditingProxy] = React.useState<Proxy | null>(null)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0,
  })
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [protocolFilter, setProtocolFilter] = React.useState<string>("all")

  const [newProxy, setNewProxy] = React.useState({
    address: "",
    protocol: "http" as "http" | "https" | "socks5",
    username: "",
    password: "",
    label: "",
  })

  // Import modal states
  const [importFile, setImportFile] = React.useState<File | null>(null)
  const [parsedProxies, setParsedProxies] = React.useState<Array<{
    address: string
    protocol: "http" | "https" | "socks4" | "socks4a" | "socks5"
    username?: string
    password?: string
    label?: string
    raw: string
  }>>([])
  const [isImporting, setIsImporting] = React.useState(false)
  const [importProgress, setImportProgress] = React.useState({ current: 0, total: 0, success: 0, failed: 0, skipped: 0 })
  const [importResults, setImportResults] = React.useState<Array<{ address: string; status: string; error?: string }>>([])
  const [isDragging, setIsDragging] = React.useState(false)
  const [isReloading, setIsReloading] = React.useState(false)
  const [deleteConfirm, setDeleteConfirm] = React.useState<{ open: boolean; proxyId: number | null }>({ open: false, proxyId: null })
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = React.useState(false)

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setPagination(prev => ({ ...prev, page: 1 }))
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchProxies = React.useCallback(async () => {
    try {
      setIsLoading(true)

      // Build sort parameters from sorting state
      const sortField = sorting.length > 0 ? sorting[0].id : undefined
      const sortOrder = sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : undefined

      const response = await api.getProxies({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearchQuery || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        protocol: protocolFilter === "all" ? undefined : protocolFilter,
        sort: sortField,
        order: sortOrder as "asc" | "desc" | undefined,
      })
      setData(response.proxies)
      setPagination(response.pagination)
    } catch (error) {
      console.error("Failed to fetch proxies:", error)
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, debouncedSearchQuery, statusFilter, protocolFilter, sorting])

  React.useEffect(() => {
    fetchProxies()
  }, [fetchProxies])

  const handleAddProxy = async () => {
    try {
      await api.addProxy(newProxy)
      setIsAddDialogOpen(false)
      setNewProxy({ address: "", protocol: "http", username: "", password: "", label: "" })
      toast.success("Proxy added successfully")
      fetchProxies()
    } catch (error) {
      console.error("Failed to add proxy:", error)
      toast.error("Failed to add proxy", error instanceof Error ? error.message : "Unknown error")
    }
  }

  const handleEditProxy = async () => {
    if (!editingProxy) return

    try {
      await api.updateProxy(editingProxy.id, {
        address: editingProxy.address,
        protocol: editingProxy.protocol,
        username: editingProxy.username,
        label: editingProxy.label,
      })
      setIsEditDialogOpen(false)
      setEditingProxy(null)
      toast.success("Proxy updated successfully")
      fetchProxies()
    } catch (error) {
      console.error("Failed to update proxy:", error)
      toast.error("Failed to update proxy", error instanceof Error ? error.message : "Unknown error")
    }
  }

  const handleDeleteProxy = async (id: number) => {
    setDeleteConfirm({ open: true, proxyId: id })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.proxyId) return

    try {
      await api.deleteProxy(deleteConfirm.proxyId)
      toast.success("Proxy deleted successfully")
      fetchProxies()
    } catch (error) {
      console.error("Failed to delete proxy:", error)
      toast.error("Failed to delete proxy", error instanceof Error ? error.message : "Unknown error")
    } finally {
      setDeleteConfirm({ open: false, proxyId: null })
    }
  }

  const handleTestProxy = async (id: number) => {
    try {
      const result = await api.testProxy(id)
      if (result.status === "active") {
        const responseTime = result.response_time || result.duration || 0
        toast.success(
          "Proxy test successful",
          `${result.address} - Response time: ${responseTime}ms`
        )
      } else {
        toast.error(
          "Proxy test failed",
          `${result.address} - ${result.error || "Unknown error"}`
        )
      }
      fetchProxies()
    } catch (error) {
      console.error("Failed to test proxy:", error)
      toast.error("Failed to test proxy", error instanceof Error ? error.message : "Unknown error")
    }
  }

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection).map(key => data[Number(key)].id)
    if (selectedIds.length === 0) return
    setBulkDeleteConfirm(true)
  }

  const confirmBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection).map(key => data[Number(key)].id)

    try {
      await api.bulkDeleteProxies({ ids: selectedIds })
      setRowSelection({})
      toast.success(`${selectedIds.length} proxies deleted successfully`)
      fetchProxies()
    } catch (error) {
      console.error("Failed to delete proxies:", error)
      toast.error("Failed to delete proxies", error instanceof Error ? error.message : "Unknown error")
    } finally {
      setBulkDeleteConfirm(false)
    }
  }

  const formatProxyForExport = (proxy: Proxy): string => {
    const credentials = proxy.username ? `${encodeURIComponent(proxy.username)}:@` : ''
    const labelParam = proxy.label ? `?label=${encodeURIComponent(proxy.label)}` : ''
    return `${proxy.protocol}://${credentials}${proxy.address}${labelParam}`
  }

  const handleExport = async (format: "txt" | "json" | "csv") => {
    try {
      if (format === "txt") {
        const allProxiesResponse = await api.getProxies({ page: 1, limit: 10000 })
        const lines = allProxiesResponse.proxies.map(formatProxyForExport)
        const content = lines.join('\n')
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `proxies.${format}`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const blob = await api.exportProxies(format)
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `proxies.${format}`
        a.click()
        URL.revokeObjectURL(url)
      }
      toast.success(`Proxies exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error("Failed to export proxies:", error)
      toast.error("Failed to export proxies", error instanceof Error ? error.message : "Unknown error")
    }
  }

  const parseProxyLine = (line: string): {
    address: string
    protocol: "http" | "https" | "socks4" | "socks4a" | "socks5"
    username?: string
    password?: string
    label?: string
    raw: string
  } | null => {
    const trimmedLine = line.trim()
    if (!trimmedLine) return null

    try {
      if (trimmedLine.includes('://')) {
        const url = new URL(trimmedLine)
        const protocol = url.protocol.replace(':', '').toLowerCase() as "http" | "https" | "socks4" | "socks4a" | "socks5"
        
        if (!['http', 'https', 'socks4', 'socks4a', 'socks5'].includes(protocol)) {
          return null
        }

        const address = `${url.hostname}:${url.port || (protocol === 'https' ? '443' : '80')}`
        const username = url.username ? decodeURIComponent(url.username) : undefined
        const password = url.password ? decodeURIComponent(url.password) : undefined
        const label = url.searchParams.get('label') || undefined

        return {
          address,
          protocol,
          username,
          password,
          label,
          raw: trimmedLine,
        }
      } else {
        const parts = trimmedLine.split(':')
        if (parts.length >= 2 && parts[1].match(/^\d+$/)) {
          return {
            address: trimmedLine,
            protocol: 'http',
            raw: trimmedLine,
          }
        }
      }
    } catch {
      const parts = trimmedLine.split(':')
      if (parts.length >= 2 && parts[1].match(/^\d+$/)) {
        return {
          address: trimmedLine,
          protocol: 'http',
          raw: trimmedLine,
        }
      }
    }

    return null
  }

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.txt')) {
      toast.error('Invalid file type', 'Please upload a .txt file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n')
      const parsed = lines
        .map(line => parseProxyLine(line))
        .filter((proxy): proxy is NonNullable<typeof proxy> => proxy !== null)

      setParsedProxies(parsed)
      setImportFile(file)
    }
    reader.readAsText(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const txtFile = files.find(f => f.name.endsWith('.txt'))

    if (txtFile) {
      handleFileUpload(txtFile)
    } else {
      toast.error('Invalid file type', 'Please upload a .txt file')
    }
  }

  const handleImport = async () => {
    if (parsedProxies.length === 0) {
      toast.error('No proxies to import', 'No valid proxies found in the file')
      return
    }

    setIsImporting(true)
    setImportProgress({ current: 0, total: parsedProxies.length, success: 0, failed: 0, skipped: 0 })
    setImportResults([])

    const results: Array<{ address: string; status: string; error?: string }> = []
    let success = 0
    let failed = 0
    let skipped = 0

    for (let i = 0; i < parsedProxies.length; i++) {
      const proxy = parsedProxies[i]

      try {
        await api.addProxy({
          address: proxy.address,
          protocol: proxy.protocol,
          username: proxy.username,
          password: proxy.password,
          label: proxy.label,
        })

        success++
        results.push({ address: proxy.address, status: 'success' })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        if (errorMessage.includes('already exists')) {
          skipped++
          results.push({
            address: proxy.address,
            status: 'skipped',
            error: 'Already exists (skipped)'
          })
        } else {
          failed++
          results.push({
            address: proxy.address,
            status: 'failed',
            error: errorMessage
          })
        }
      }

      setImportProgress({
        current: i + 1,
        total: parsedProxies.length,
        success,
        failed,
        skipped,
      })
      setImportResults([...results])
    }

    setIsImporting(false)
    setTimeout(() => {
      fetchProxies()
    }, 1000)
  }

  const resetImportDialog = () => {
    setImportFile(null)
    setParsedProxies([])
    setIsImporting(false)
    setImportProgress({ current: 0, total: 0, success: 0, failed: 0, skipped: 0 })
    setImportResults([])
  }

  const handleReloadProxies = async () => {
    try {
      setIsReloading(true)
      await api.reloadProxies()
      toast.success('Proxy pool reloaded', 'All proxies from database are now available for rotation')
    } catch (error) {
      console.error('Failed to reload proxies:', error)
      toast.error('Failed to reload proxy pool', error instanceof Error ? error.message : "Unknown error")
    } finally {
      setIsReloading(false)
    }
  }

  const columns: ColumnDef<Proxy>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "address",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Address
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-mono">{row.getValue("address")}</div>,
    },
    {
      accessorKey: "protocol",
      header: "Protocol",
      cell: ({ row }) => (
        <Badge variant="outline" className="uppercase">
          {row.getValue("protocol")}
        </Badge>
      ),
    },
    {
      accessorKey: "label",
      header: "Label",
      cell: ({ row }) => {
        const label = row.getValue("label") as string | undefined
        return label ? (
          <span className="text-muted-foreground">{label}</span>
        ) : (
          <span className="text-muted-foreground/50">-</span>
        )
      },
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
        const status = row.getValue("status") as string
        const statusMap = {
          active: "online" as const,
          failed: "offline" as const,
          idle: "idle" as const,
        }
        const statusColors = {
          active: "text-green-600",
          failed: "text-red-600",
          idle: "text-yellow-600",
        }
        return (
          <div className={`flex items-center gap-2 ${statusColors[status as keyof typeof statusColors]}`}>
            <div className={`h-2 w-2 rounded-full ${
              status === 'active' ? 'bg-green-600' :
              status === 'failed' ? 'bg-red-600' :
              'bg-yellow-600'
            }`} />
            <span className="capitalize font-medium">{status}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "requests",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Requests
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const value = parseFloat(row.getValue("requests"))
        return <div suppressHydrationWarning>{value.toLocaleString('en-US')}</div>
      },
    },
    {
      accessorKey: "success_rate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Success Rate
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const value = parseFloat(row.getValue("success_rate"))
        return <div>{value.toFixed(1)}%</div>
      },
    },
    {
      accessorKey: "avg_response_time",
      header: "Avg Response",
      cell: ({ row }) => {
        const value = parseFloat(row.getValue("avg_response_time"))
        return <div>{value}ms</div>
      },
    },
    {
      accessorKey: "last_check",
      header: "Last Check",
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const proxy = row.original

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
                onClick={() => navigator.clipboard.writeText(proxy.address)}
              >
                Copy address
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleTestProxy(proxy.id)}>
                Test proxy
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setEditingProxy(proxy)
                setIsEditDialogOpen(true)
              }}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => handleDeleteProxy(proxy.id)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: pagination.total_pages,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  if (isLoading && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proxy Management</h1>
          <p className="text-muted-foreground">
            Manage and monitor your proxy infrastructure
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Proxies</CardTitle>
              <CardDescription>
                {pagination.total} total proxies
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Proxy
              </Button>
              <Button
                variant="outline"
                onClick={handleReloadProxies}
                disabled={isReloading}
              >
                <Loader2 className={`mr-2 h-4 w-4 ${isReloading ? 'animate-spin' : ''}`} />
                Reload Pool
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Bulk Actions
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsImportDialogOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Import from TXT
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport("txt")}>
                    <Download className="mr-2 h-4 w-4" />
                    Export as TXT
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("json")}>
                    <Download className="mr-2 h-4 w-4" />
                    Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("csv")}>
                    <Download className="mr-2 h-4 w-4" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={handleBulkDelete}
                    disabled={Object.keys(rowSelection).length === 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete selected ({Object.keys(rowSelection).length})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search by address..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="max-w-sm"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <Filter className="h-4 w-4" />
                    {(statusFilter !== "all" || protocolFilter !== "all") && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filters</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-2">
                    <Label className="text-xs text-muted-foreground mb-2 block">Status</Label>
                    <Select
                      value={statusFilter}
                      onValueChange={(value) => {
                        setStatusFilter(value)
                        setPagination(prev => ({ ...prev, page: 1 }))
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="idle">Idle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-2">
                    <Label className="text-xs text-muted-foreground mb-2 block">Protocol</Label>
                    <Select
                      value={protocolFilter}
                      onValueChange={(value) => {
                        setProtocolFilter(value)
                        setPagination(prev => ({ ...prev, page: 1 }))
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All protocols" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All protocols</SelectItem>
                        <SelectItem value="http">HTTP</SelectItem>
                        <SelectItem value="https">HTTPS</SelectItem>
                        <SelectItem value="socks4">SOCKS4</SelectItem>
                        <SelectItem value="socks4a">SOCKS4A</SelectItem>
                        <SelectItem value="socks5">SOCKS5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Columns <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between space-x-2">
              <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.total_pages} ({pagination.total} total proxies)
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.total_pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Proxy Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Proxy</DialogTitle>
            <DialogDescription>
              Add a new proxy to your pool
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="192.168.1.100:8001"
                className="font-mono"
                value={newProxy.address}
                onChange={(e) => setNewProxy({ ...newProxy, address: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="protocol">Protocol</Label>
              <Select
                value={newProxy.protocol}
                onValueChange={(value: any) => setNewProxy({ ...newProxy, protocol: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="http">HTTP</SelectItem>
                  <SelectItem value="https">HTTPS</SelectItem>
                  <SelectItem value="socks4">SOCKS4</SelectItem>
                  <SelectItem value="socks4a">SOCKS4A</SelectItem>
                  <SelectItem value="socks5">SOCKS5</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username (optional)</Label>
              <Input
                id="username"
                value={newProxy.username}
                onChange={(e) => setNewProxy({ ...newProxy, username: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password (optional)</Label>
              <Input
                id="password"
                type="password"
                value={newProxy.password}
                onChange={(e) => setNewProxy({ ...newProxy, password: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="label">Label (optional)</Label>
              <Input
                id="label"
                placeholder="e.g., US-East, Datacenter-1"
                value={newProxy.label}
                onChange={(e) => setNewProxy({ ...newProxy, label: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddProxy}>
              Add Proxy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Proxy Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Proxy</DialogTitle>
            <DialogDescription>
              Update proxy configuration
            </DialogDescription>
          </DialogHeader>
          {editingProxy && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  placeholder="192.168.1.100:8001"
                  className="font-mono"
                  value={editingProxy.address}
                  onChange={(e) => setEditingProxy({ ...editingProxy, address: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-protocol">Protocol</Label>
                <Select
                  value={editingProxy.protocol}
                  onValueChange={(value: any) => setEditingProxy({ ...editingProxy, protocol: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="http">HTTP</SelectItem>
                    <SelectItem value="https">HTTPS</SelectItem>
                    <SelectItem value="socks4">SOCKS4</SelectItem>
                    <SelectItem value="socks4a">SOCKS4A</SelectItem>
                    <SelectItem value="socks5">SOCKS5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-username">Username (optional)</Label>
                <Input
                  id="edit-username"
                  value={editingProxy.username || ""}
                  onChange={(e) => setEditingProxy({ ...editingProxy, username: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-label">Label (optional)</Label>
                <Input
                  id="edit-label"
                  placeholder="e.g., US-East, Datacenter-1"
                  value={editingProxy.label || ""}
                  onChange={(e) => setEditingProxy({ ...editingProxy, label: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditProxy}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Proxies Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
        setIsImportDialogOpen(open)
        if (!open) resetImportDialog()
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Proxies from TXT</DialogTitle>
            <DialogDescription>
              Upload a .txt file with proxies (one per line). Supported formats: protocol://user:pass@ip:port?label=name or ip:port
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {!importFile ? (
              // File Upload Area
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = '.txt'
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) handleFileUpload(file)
                  }
                  input.click()
                }}
              >
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">
                  Drop your .txt file here or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  Format: protocol://user:pass@ip:port?label=name or ip:port
                </p>
              </div>
            ) : (
              // Preview and Configuration
              <>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{importFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {parsedProxies.length} valid proxies found
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setImportFile(null)
                      setParsedProxies([])
                    }}
                    disabled={isImporting}
                  >
                    Change File
                  </Button>
                </div>

                {parsedProxies.length > 0 && (
                  <>
                    <div className="grid gap-2">
                      <Label>Preview (first 10 proxies)</Label>
                      <div className="border rounded-md p-3 bg-muted/30 max-h-48 overflow-y-auto">
                        <div className="font-mono text-sm space-y-2">
                          {parsedProxies.slice(0, 10).map((proxy, idx) => (
                            <div key={idx} className="text-muted-foreground border-b border-muted pb-2 last:border-0 last:pb-0">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="uppercase text-xs">{proxy.protocol}</Badge>
                                <span>{proxy.address}</span>
                              </div>
                              {(proxy.username || proxy.label) && (
                                <div className="text-xs mt-1 flex gap-3">
                                  {proxy.username && <span>User: {proxy.username}</span>}
                                  {proxy.label && <span>Label: {proxy.label}</span>}
                                </div>
                              )}
                            </div>
                          ))}
                          {parsedProxies.length > 10 && (
                            <div className="text-xs text-muted-foreground pt-1">
                              ... and {parsedProxies.length - 10} more
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {isImporting && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Progress: {importProgress.current} / {importProgress.total}
                          </span>
                          <div className="flex gap-3 text-muted-foreground">
                            <span>
                              <span className="text-green-600 font-medium">{importProgress.success}</span> success
                            </span>
                            {importProgress.skipped > 0 && (
                              <span>
                                <span className="text-yellow-600 font-medium">{importProgress.skipped}</span> skipped
                              </span>
                            )}
                            {importProgress.failed > 0 && (
                              <span>
                                <span className="text-red-600 font-medium">{importProgress.failed}</span> failed
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2.5">
                          <div
                            className="bg-primary h-2.5 rounded-full transition-all duration-300"
                            style={{
                              width: `${(importProgress.current / importProgress.total) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {importProgress.current === importProgress.total && importProgress.total > 0 && (
                      <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Import Complete</h4>
                          <div className="flex gap-4 text-sm">
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              {importProgress.success} successful
                            </span>
                            {importProgress.skipped > 0 && (
                              <span className="flex items-center gap-1 text-yellow-600">
                                <AlertCircle className="h-4 w-4" />
                                {importProgress.skipped} skipped
                              </span>
                            )}
                            {importProgress.failed > 0 && (
                              <span className="flex items-center gap-1 text-red-600">
                                <XCircle className="h-4 w-4" />
                                {importProgress.failed} failed
                              </span>
                            )}
                          </div>
                        </div>

                        {(importResults.filter(r => r.status === 'skipped').length > 0 ||
                          importResults.filter(r => r.status === 'failed').length > 0) && (
                          <div className="max-h-48 overflow-y-auto text-sm space-y-2">
                            {importResults.filter(r => r.status === 'skipped').length > 0 && (
                              <div>
                                <p className="font-medium text-yellow-600 mb-1">Skipped proxies (duplicates):</p>
                                <div className="space-y-0.5">
                                  {importResults
                                    .filter(r => r.status === 'skipped')
                                    .map((result, idx) => (
                                      <div key={idx} className="font-mono text-xs text-yellow-600/80">
                                        {result.address}
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                            {importResults.filter(r => r.status === 'failed').length > 0 && (
                              <div>
                                <p className="font-medium text-red-600 mb-1">Failed proxies:</p>
                                <div className="space-y-0.5">
                                  {importResults
                                    .filter(r => r.status === 'failed')
                                    .map((result, idx) => (
                                      <div key={idx} className="font-mono text-xs text-red-600">
                                        {result.address}: {result.error}
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsImportDialogOpen(false)
                resetImportDialog()
              }}
              disabled={isImporting}
            >
              {importProgress.current === importProgress.total && importProgress.total > 0 ? 'Close' : 'Cancel'}
            </Button>
            {importFile && parsedProxies.length > 0 && (
              <Button
                onClick={handleImport}
                disabled={isImporting || (importProgress.current === importProgress.total && importProgress.total > 0)}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : importProgress.current === importProgress.total && importProgress.total > 0 ? (
                  'Import Complete'
                ) : (
                  `Import ${parsedProxies.length} Proxies`
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ open, proxyId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the proxy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {Object.keys(rowSelection).length} proxies?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected proxies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-red-600 hover:bg-red-700">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
