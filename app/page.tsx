"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BasketsTable } from "@/components/baskets-table"
import { CreateBasketDialog } from "@/components/create-basket-dialog"
import { BasketDetailDialog } from "@/components/basket-detail-dialog"
import {
  PlusIcon,
  LayersIcon,
  TrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  SearchIcon,
} from "lucide-react"
import { MOCK_BASKETS, type Basket } from "@/lib/data"

type FilterStatus = "All" | "Active" | "Pending Approval" | "Draft" | "Rejected"

function StatCard({
  label,
  value,
  icon,
  sub,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  sub?: string
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <div className="flex size-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
          {icon}
        </div>
      </div>
      <span className="text-2xl font-bold text-foreground tabular-nums">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  )
}

export default function HomePage() {
  const [baskets, setBaskets] = useState<Basket[]>(MOCK_BASKETS)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedBasket, setSelectedBasket] = useState<Basket | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("All")
  const [search, setSearch] = useState("")

  const handleRowClick = (basket: Basket) => {
    setSelectedBasket(basket)
    setDetailOpen(true)
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

  const totalAUM = baskets
    .filter((b) => b.status === "Active")
    .reduce((sum, b) => sum + b.totalValue, 0)

  const formatAUM = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`

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

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-[var(--status-approved)]" />
            Live &middot;{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
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

        {/* ── Stats cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Total Baskets"
            value={baskets.length}
            icon={<LayersIcon className="size-4" />}
            sub={`${statusCounts.Active} active`}
          />
          <StatCard
            label="Active AUM"
            value={formatAUM(totalAUM)}
            icon={<TrendingUpIcon className="size-4" />}
            sub="Across all active baskets"
          />
          <StatCard
            label="Pending Review"
            value={statusCounts["Pending Approval"]}
            icon={<ClockIcon className="size-4" />}
            sub="Awaiting approval"
          />
          <StatCard
            label="Fully Approved"
            value={statusCounts.Active}
            icon={<CheckCircleIcon className="size-4" />}
            sub="Ready to sell to clients"
          />
        </div>

        {/* ── Filters + search ────────────────────────────────────── */}
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
          <BasketsTable baskets={filtered} onRowClick={handleRowClick} />
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
      />
    </div>
  )
}
