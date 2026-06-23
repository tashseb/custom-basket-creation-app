"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  TrendingUpIcon,
  BarChart3Icon,
  UserCheckIcon,
  CalendarIcon,
  BuildingIcon,
  ListIcon,
  ShieldCheckIcon,
} from "lucide-react"
import type { Basket, ApproverStatus, BasketStatus } from "@/lib/data"

interface BasketDetailDialogProps {
  basket: Basket | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toLocaleString()}`
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function StatusBadge({ status }: { status: BasketStatus }) {
  const map: Record<BasketStatus, { label: string; class: string }> = {
    Active: { label: "Active", class: "bg-[var(--status-approved)] text-white border-transparent" },
    "Pending Approval": { label: "Pending Approval", class: "bg-[var(--status-pending)] text-white border-transparent" },
    Draft: { label: "Draft", class: "bg-muted text-muted-foreground border-border" },
    Rejected: { label: "Rejected", class: "bg-destructive text-white border-transparent" },
  }
  const { label, class: cls } = map[status]
  return <Badge className={`text-xs font-medium ${cls}`}>{label}</Badge>
}

function RiskBadge({ rating }: { rating: "Low" | "Medium" | "High" }) {
  const map = {
    Low: "bg-[var(--status-approved)]/15 text-[var(--status-approved)] border-[var(--status-approved)]/30",
    Medium: "bg-[var(--status-pending)]/15 text-[var(--status-pending)] border-[var(--status-pending)]/30",
    High: "bg-destructive/15 text-destructive border-destructive/30",
  }
  return <Badge variant="outline" className={`text-xs ${map[rating]}`}>{rating} Risk</Badge>
}

function ApproverStatusIcon({ status }: { status: ApproverStatus }) {
  if (status === "Approved") return <CheckCircleIcon className="size-4 text-[var(--status-approved)]" />
  if (status === "Rejected") return <XCircleIcon className="size-4 text-destructive" />
  return <ClockIcon className="size-4 text-[var(--status-pending)]" />
}

function ApproverStatusBadge({ status }: { status: ApproverStatus }) {
  const map: Record<ApproverStatus, string> = {
    Approved: "bg-[var(--status-approved)]/10 text-[var(--status-approved)] border-[var(--status-approved)]/20",
    Pending: "bg-[var(--status-pending)]/10 text-[var(--status-pending)] border-[var(--status-pending)]/20",
    Rejected: "bg-destructive/10 text-destructive border-destructive/20",
  }
  return <Badge variant="outline" className={`text-xs ${map[status]}`}>{status}</Badge>
}

export function BasketDetailDialog({ basket, open, onOpenChange }: BasketDetailDialogProps) {
  if (!basket) return null

  const approvedCount = basket.approvers.filter((a) => a.status === "Approved").length
  const totalApprovers = basket.approvers.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[90vw] max-h-[90vh] flex flex-col overflow-hidden font-sans p-0">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <DialogHeader className="pb-0">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={basket.status} />
                <RiskBadge rating={basket.riskRating} />
                <Badge variant="outline" className="text-xs text-muted-foreground border-border">
                  {basket.category}
                </Badge>
              </div>
              <DialogTitle className="text-xl font-semibold text-foreground">
                {basket.name}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                {basket.description}
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Stats strip */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              {
                icon: <TrendingUpIcon className="size-4 text-accent" />,
                label: "Total Value",
                value: formatCurrency(basket.totalValue),
              },
              {
                icon: <BarChart3Icon className="size-4 text-accent" />,
                label: "Holdings",
                value: `${basket.stockCount} stocks`,
              },
              {
                icon: <UserCheckIcon className="size-4 text-accent" />,
                label: "Approvals",
                value: `${approvedCount} / ${totalApprovers}`,
              },
              {
                icon: <CalendarIcon className="size-4 text-accent" />,
                label: "Last Updated",
                value: formatDate(basket.updatedAt),
              },
            ].map(({ icon, label, value }) => (
              <div
                key={label}
                className="flex flex-col gap-1 rounded-lg border border-border bg-muted/50 px-3 py-2.5"
              >
                <div className="flex items-center gap-1.5">
                  {icon}
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <span className="text-sm font-semibold text-foreground tabular-nums">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────── */}
        <Tabs defaultValue="holdings" className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 pt-3 pb-0 shrink-0">
            <TabsList className="h-9 w-fit">
              <TabsTrigger value="holdings" className="gap-1.5 text-xs">
                <ListIcon className="size-3.5" />
                Stock Holdings
                <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground tabular-nums">
                  {basket.stocks.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="approvals" className="gap-1.5 text-xs">
                <ShieldCheckIcon className="size-3.5" />
                Approval Chain
                <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground tabular-nums">
                  {approvedCount}/{totalApprovers}
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Stock Holdings Tab ─────────────────────────────── */}
          <TabsContent value="holdings" className="flex-1 overflow-y-auto px-6 pb-4 mt-3 data-[state=inactive]:hidden">
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/60 border-b border-border">
                    {["Ticker", "Company", "Sector", "Weight", "Shares", "Price", "Market Value"].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {basket.stocks.map((stock, i) => (
                    <tr
                      key={stock.id}
                      className={`border-b border-border last:border-0 hover:bg-muted/40 transition-colors ${
                        i % 2 === 0 ? "bg-card" : "bg-muted/20"
                      }`}
                    >
                      <td className="px-3 py-3">
                        <span className="font-mono text-xs font-bold text-foreground bg-muted px-1.5 py-0.5 rounded">
                          {stock.ticker}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-sm text-foreground">{stock.name}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs text-muted-foreground">{stock.sector}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-accent"
                              style={{ width: `${Math.min(stock.weight, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium tabular-nums text-foreground">
                            {stock.weight.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 tabular-nums text-sm text-foreground">
                        {stock.shares.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 tabular-nums text-sm text-foreground">
                        ${stock.price.toFixed(2)}
                      </td>
                      <td className="px-3 py-3 tabular-nums text-sm font-medium text-foreground">
                        {formatCurrency(stock.marketValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ── Approval Chain Tab ─────────────────────────────── */}
          <TabsContent value="approvals" className="flex-1 overflow-y-auto px-6 pb-4 mt-3 data-[state=inactive]:hidden">
            {/* Overall progress */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--status-approved)] transition-all"
                  style={{ width: totalApprovers > 0 ? `${(approvedCount / totalApprovers) * 100}%` : "0%" }}
                />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {approvedCount} of {totalApprovers} approved
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {basket.approvers.map((approver, i) => (
                <div
                  key={approver.id}
                  className="flex items-start gap-4 rounded-lg border border-border bg-card px-5 py-4"
                >
                  {/* Step number */}
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground mt-0.5">
                    {i + 1}
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-foreground leading-tight">
                          {approver.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <BuildingIcon className="size-3 shrink-0" />
                          <span>{approver.role}</span>
                          <span className="opacity-40">·</span>
                          <span>{approver.department}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <ApproverStatusIcon status={approver.status} />
                        <ApproverStatusBadge status={approver.status} />
                      </div>
                    </div>

                    {approver.comment && (
                      <div className="rounded-md border border-border bg-muted/50 px-3 py-2.5">
                        <p className="text-xs text-foreground/80 italic leading-relaxed">
                          &ldquo;{approver.comment}&rdquo;
                        </p>
                      </div>
                    )}

                    {approver.reviewedAt ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ClockIcon className="size-3 shrink-0" />
                        <span>Reviewed {formatDate(approver.reviewedAt)}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ClockIcon className="size-3 shrink-0" />
                        <span>Awaiting review</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border shrink-0 text-xs text-muted-foreground bg-muted/30">
          <span>Created by <span className="font-medium text-foreground">{basket.createdBy}</span></span>
          <span>Basket ID: <span className="font-mono">{basket.id}</span></span>
          <span>Created {formatDate(basket.createdAt)}</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
