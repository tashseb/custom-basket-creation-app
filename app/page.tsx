"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BasketsTable } from "@/components/baskets-table"
import { CreateBasketDialog } from "@/components/create-basket-dialog"
import { BasketDetailDialog } from "@/components/basket-detail-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  PlusIcon,
  LayersIcon,
  SearchIcon,
  ChevronsUpDownIcon,
  UserIcon,
  ShieldCheckIcon,
  CheckIcon,
} from "lucide-react"
import { MOCK_BASKETS, VIEWERS, type Basket, type Viewer } from "@/lib/data"

type FilterStatus = "All" | "Active" | "Pending Approval" | "Draft" | "Rejected"

export default function HomePage() {
  const [baskets, setBaskets] = useState<Basket[]>(MOCK_BASKETS)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedBasket, setSelectedBasket] = useState<Basket | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("All")
  const [search, setSearch] = useState("")
  const [viewer, setViewer] = useState<Viewer>(VIEWERS[0])

  const handleRowClick = (basket: Basket) => {
    setSelectedBasket(basket)
    setDetailOpen(true)
  }

  const handleUpdateBasket = (updated: Basket) => {
    const stamped = { ...updated, updatedAt: new Date().toISOString().split("T")[0] }
    setBaskets((prev) => prev.map((b) => (b.id === stamped.id ? stamped : b)))
    setSelectedBasket(stamped)
  }

  const handleCreateBasket = (
    data: Omit<Basket, "id" | "createdAt" | "updatedAt" | "totalValue" | "stockCount">
  ) => {
    const newBasket: Basket = {
      ...data,
      id: `bsk-${String(baskets.length + 1).padStart(3, "0")}`,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      totalValue: data.stocks.reduce((sum, s) => sum + s.marketValue, 0),
      stockCount: data.stocks.length,
    }
    setBaskets((prev) => [newBasket, ...prev])
  }

  const handleDeleteBasket = (id: string) => {
    // Removing the basket also drops its constituents and approval records,
    // since those live on the basket object itself.
    setBaskets((prev) => prev.filter((b) => b.id !== id))
    if (selectedBasket?.id === id) {
      setDetailOpen(false)
      setSelectedBasket(null)
    }
  }

  const handleDuplicateBasket = (source: Basket, mode: "details" | "full") => {
    const today = new Date().toISOString().split("T")[0]
    const nextId = `bsk-${String(baskets.length + 1).padStart(3, "0")}`
    const keepConstituents = mode === "full"
    const stocks = keepConstituents
      ? source.stocks.map((s, i) => ({ ...s, id: `${nextId}-s${i + 1}` }))
      : []

    const duplicate: Basket = {
      ...source,
      id: nextId,
      name: `${source.name} (Copy)`,
      status: "Draft",
      createdBy: viewer.name,
      createdAt: today,
      updatedAt: today,
      stocks,
      stockCount: stocks.length,
      // A duplicate always starts a fresh approval cycle, regardless of mode.
      approvers: source.approvers.map((a, i) => ({
        id: `${nextId}-a${i + 1}`,
        name: a.name,
        role: a.role,
        department: a.department,
        status: "Pending" as const,
      })),
      // Draft baskets carry no committed value until re-priced.
      totalValue: 0,
    }
    setBaskets((prev) => [duplicate, ...prev])
  }

  const filtered = baskets.filter((b) => {
    const matchStatus = filterStatus === "All" || b.status === filterStatus
    const matchSearch =
      search.trim() === "" ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase()) ||
      b.createdBy.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const statusCounts: Record<FilterStatus, number> = {
    All: baskets.length,
    Active: baskets.filter((b) => b.status === "Active").length,
    "Pending Approval": baskets.filter((b) => b.status === "Pending Approval").length,
    Draft: baskets.filter((b) => b.status === "Draft").length,
    Rejected: baskets.filter((b) => b.status === "Rejected").length,
  }

  const FILTER_OPTIONS: FilterStatus[] = ["All", "Active", "Pending Approval", "Draft", "Rejected"]

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* ── Top nav bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <LayersIcon className="size-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground leading-none">Basket Manager</span>
              <span className="text-xs text-muted-foreground leading-none mt-0.5">
                Custom Portfolio Baskets
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-left transition-colors hover:bg-muted">
              <div
                className={`flex size-7 items-center justify-center rounded-full text-primary-foreground ${
                  viewer.role === "approver" ? "bg-accent" : "bg-primary"
                }`}
              >
                {viewer.role === "approver" ? (
                  <ShieldCheckIcon className="size-3.5" />
                ) : (
                  <UserIcon className="size-3.5" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground leading-none">
                  {viewer.name}
                </span>
                <span className="text-[11px] text-muted-foreground leading-none mt-0.5">
                  {viewer.role === "approver" ? "Approver" : "Creator"} &middot; {viewer.title}
                </span>
              </div>
              <ChevronsUpDownIcon className="size-3.5 text-muted-foreground ml-1" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  View as
                </DropdownMenuLabel>
                {VIEWERS.filter((v) => v.role === "user").map((v) => (
                  <ViewerMenuItem
                    key={v.id}
                    viewer={v}
                    active={v.id === viewer.id}
                    onSelect={() => setViewer(v)}
                  />
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Approvers
                </DropdownMenuLabel>
                {VIEWERS.filter((v) => v.role === "approver").map((v) => (
                  <ViewerMenuItem
                    key={v.id}
                    viewer={v}
                    active={v.id === viewer.id}
                    onSelect={() => setViewer(v)}
                  />
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 flex flex-col gap-8">
        {/* ── Page title + action ─────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-foreground text-balance">Custom Baskets</h1>
            <p className="text-sm text-muted-foreground">
              Create, manage, and track approval workflows for custom investment baskets.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="shrink-0">
            <PlusIcon data-icon="inline-start" />
            New Basket
          </Button>
        </div>

        {/* ── Filters + search ────────────────────────────���───────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTER_OPTIONS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  filterStatus === status
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {status}
                <Badge
                  variant="secondary"
                  className={`text-xs px-1.5 py-0 h-4 min-w-5 tabular-nums ${
                    filterStatus === status
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {statusCounts[status]}
                </Badge>
              </button>
            ))}
          </div>

          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              className="h-8 w-56 rounded-lg border border-border bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Search baskets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ── Baskets table ───────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
            <span className="font-medium text-foreground">{baskets.length}</span> baskets
          </span>
          <BasketsTable
            baskets={filtered}
            onRowClick={handleRowClick}
            onDelete={handleDeleteBasket}
            onDuplicate={handleDuplicateBasket}
          />
        </div>
      </main>

      {/* ── Dialogs ─────────────────────────────────────────────── */}
      <CreateBasketDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={handleCreateBasket}
      />
      <BasketDetailDialog
        basket={selectedBasket}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        viewer={viewer}
        onUpdateBasket={handleUpdateBasket}
      />
    </div>
  )
}

function ViewerMenuItem({
  viewer,
  active,
  onSelect,
}: {
  viewer: Viewer
  active: boolean
  onSelect: () => void
}) {
  return (
    <DropdownMenuItem onClick={onSelect} className="gap-2.5 py-2">
      <div
        className={`flex size-7 items-center justify-center rounded-full text-primary-foreground ${
          viewer.role === "approver" ? "bg-accent" : "bg-primary"
        }`}
      >
        {viewer.role === "approver" ? (
          <ShieldCheckIcon className="size-3.5" />
        ) : (
          <UserIcon className="size-3.5" />
        )}
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-xs font-medium text-foreground leading-tight">{viewer.name}</span>
        <span className="text-[11px] text-muted-foreground leading-tight truncate">
          {viewer.title}
        </span>
      </div>
      {active && <CheckIcon className="size-4 text-accent shrink-0" />}
    </DropdownMenuItem>
  )
}
