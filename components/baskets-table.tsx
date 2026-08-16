"use client"

import { Badge } from "@/components/ui/badge"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  FileEditIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowUpDownIcon,
  MessageSquareIcon,
} from "lucide-react"
import type { Basket, BasketStatus, Approver } from "@/lib/data"
import { useState } from "react"
import { BasketRowActions } from "@/components/basket-row-actions"

interface BasketsTableProps {
  baskets: Basket[]
  onRowClick: (basket: Basket) => void
  onDelete: (id: string) => void
  onDuplicate: (basket: Basket, mode: "details" | "full") => void
}

type SortKey = "name" | "status" | "totalValue" | "stockCount" | "riskRating" | "createdAt"
type SortDir = "asc" | "desc"

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toLocaleString()}`
}

function StatusBadge({ status }: { status: BasketStatus }) {
  const map: Record<BasketStatus, { icon: React.ReactNode; class: string }> = {
    Active: {
      icon: <CheckCircleIcon className="size-3" />,
      class: "bg-[var(--status-approved)]/12 text-[var(--status-approved)] border-[var(--status-approved)]/25",
    },
    "Pending Approval": {
      icon: <ClockIcon className="size-3" />,
      class: "bg-[var(--status-pending)]/12 text-[var(--status-pending)] border-[var(--status-pending)]/25",
    },
    Draft: {
      icon: <FileEditIcon className="size-3" />,
      class: "bg-muted text-muted-foreground border-border",
    },
    Rejected: {
      icon: <XCircleIcon className="size-3" />,
      class: "bg-destructive/12 text-destructive border-destructive/25",
    },
  }
  const { icon, class: cls } = map[status]
  return (
    <Badge variant="outline" className={`flex items-center gap-1 text-xs font-medium ${cls}`}>
      {icon}
      {status}
    </Badge>
  )
}

function RiskBadge({ rating }: { rating: "Low" | "Medium" | "High" }) {
  const map = {
    Low: "text-[var(--status-approved)]",
    Medium: "text-[var(--status-pending)]",
    High: "text-destructive",
  }
  return <span className={`text-xs font-semibold tabular-nums ${map[rating]}`}>{rating}</span>
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function approverStatusMeta(status: Approver["status"]) {
  if (status === "Approved")
    return {
      icon: <CheckCircleIcon className="size-3" />,
      color: "text-[var(--status-approved)]",
      bg: "bg-[var(--status-approved)]/10",
      border: "border-[var(--status-approved)]/30",
      dot: "bg-[var(--status-approved)] ring-[var(--status-approved)]/25",
      label: "Approved",
    }
  if (status === "Rejected")
    return {
      icon: <XCircleIcon className="size-3" />,
      color: "text-destructive",
      bg: "bg-destructive/10",
      border: "border-destructive/30",
      dot: "bg-destructive ring-destructive/25",
      label: "Rejected",
    }
  return {
    icon: <ClockIcon className="size-3" />,
    color: "text-[var(--status-pending)]",
    bg: "bg-[var(--status-pending)]/10",
    border: "border-[var(--status-pending)]/30",
    dot: "bg-muted-foreground/35 ring-muted-foreground/15",
    label: "Pending",
  }
}

function ApproverCard({ approver }: { approver: Approver }) {
  const meta = approverStatusMeta(approver.status)
  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger
        className={`relative flex items-center justify-center size-7 rounded-full text-[10px] font-bold ring-2 ring-offset-1 ring-offset-card cursor-default select-none transition-transform hover:scale-110 hover:z-10 ${meta.dot}`}
        style={{ color: "white" }}
        aria-label={`${approver.name} — ${meta.label}`}
      >
        {getInitials(approver.name)}
        <span
          className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card ${
            approver.status === "Approved"
              ? "bg-[var(--status-approved)]"
              : approver.status === "Rejected"
              ? "bg-destructive"
              : "bg-[var(--status-pending)]"
          }`}
        />
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="center"
        className="w-64 p-0 overflow-hidden shadow-lg"
      >
        {/* Header strip */}
        <div className={`flex items-center gap-3 px-3 py-2.5 ${meta.bg} border-b ${meta.border}`}>
          <div
            className={`flex items-center justify-center size-8 rounded-full text-xs font-bold shrink-0 ring-2 ${meta.dot}`}
            style={{ color: "white" }}
          >
            {getInitials(approver.name)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-foreground truncate leading-tight">
              {approver.name}
            </span>
            <span className="text-[11px] text-muted-foreground truncate leading-tight">
              {approver.role}
            </span>
            <span className="text-[10px] text-muted-foreground/70 truncate leading-tight">
              {approver.department}
            </span>
          </div>
          <div className="ml-auto shrink-0">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${meta.bg} ${meta.color} ${meta.border}`}
            >
              {meta.icon}
              {meta.label}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="px-3 py-2 flex flex-col gap-1.5">
          {approver.reviewedAt ? (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ClockIcon className="size-3 shrink-0" />
              <span>
                Reviewed{" "}
                {new Date(approver.reviewedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ClockIcon className="size-3 shrink-0" />
              <span>Awaiting review</span>
            </div>
          )}

          {approver.comment && (
            <div className="flex gap-1.5 mt-0.5">
              <MessageSquareIcon className="size-3 shrink-0 mt-0.5 text-muted-foreground" />
              <p className="text-[11px] text-foreground/80 leading-relaxed italic">
                &ldquo;{approver.comment}&rdquo;
              </p>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

function ApprovalProgress({ approvers }: { approvers: Basket["approvers"] }) {
  const approved = approvers.filter((a) => a.status === "Approved").length
  const total = approvers.length

  return (
    <div className="flex items-center gap-3">
      {/* Avatar stack */}
      <div className="flex -space-x-1.5">
        {approvers.map((a) => (
          <ApproverCard key={a.id} approver={a} />
        ))}
      </div>
      {/* Tally */}
      <span className="text-xs tabular-nums text-muted-foreground font-medium">
        {approved}
        <span className="text-muted-foreground/50">/{total}</span>
      </span>
    </div>
  )
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDownIcon className="size-3 text-muted-foreground/50" />
  return dir === "asc"
    ? <ArrowUpIcon className="size-3 text-accent" />
    : <ArrowDownIcon className="size-3 text-accent" />
}

const COLUMNS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "name", label: "Basket Name" },
  { key: "status", label: "Status" },
  { key: "riskRating", label: "Risk" },
  { key: "stockCount", label: "Holdings", align: "right" },
  { key: "totalValue", label: "Total Value", align: "right" },
  { key: "createdAt", label: "Created" },
]

export function BasketsTable({ baskets, onRowClick, onDelete, onDuplicate }: BasketsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("createdAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const sorted = [...baskets].sort((a, b) => {
    let cmp = 0
    if (sortKey === "name") cmp = a.name.localeCompare(b.name)
    else if (sortKey === "status") cmp = a.status.localeCompare(b.status)
    else if (sortKey === "totalValue") cmp = a.totalValue - b.totalValue
    else if (sortKey === "stockCount") cmp = a.stockCount - b.stockCount
    else if (sortKey === "riskRating") {
      const order = { Low: 0, Medium: 1, High: 2 }
      cmp = order[a.riskRating] - order[b.riskRating]
    } else if (sortKey === "createdAt") cmp = a.createdAt.localeCompare(b.createdAt)
    return sortDir === "asc" ? cmp : -cmp
  })

  if (baskets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <div className="size-14 rounded-full bg-muted flex items-center justify-center">
          <FileEditIcon className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">No baskets yet</p>
        <p className="text-xs text-muted-foreground">
          Create your first custom basket to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/60 border-b border-border">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${
                  col.align === "right" ? "text-right" : "text-left"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSort(col.key)}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                  style={{ marginLeft: col.align === "right" ? "auto" : undefined }}
                >
                  {col.label}
                  <SortIcon active={sortKey === col.key} dir={sortDir} />
                </button>
              </th>
            ))}
            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left">
              Approvals
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left">
              Category
            </th>
            <th className="sticky right-0 z-10 w-12 bg-muted/60 px-4 py-3 shadow-[-8px_0_8px_-6px_rgba(0,0,0,0.08)]">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((basket, i) => (
            <tr
              key={basket.id}
              onClick={() => onRowClick(basket)}
              className={`border-b border-border last:border-0 cursor-pointer transition-colors hover:bg-accent/5 ${
                i % 2 === 0 ? "bg-card" : "bg-muted/15"
              }`}
            >
              {/* Name + description */}
              <td className="px-4 py-4">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-foreground">{basket.name}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[220px]">
                    {basket.description}
                  </span>
                  <span className="text-xs text-muted-foreground/60">by {basket.createdBy}</span>
                </div>
              </td>

              {/* Status */}
              <td className="px-4 py-4">
                <StatusBadge status={basket.status} />
              </td>

              {/* Risk */}
              <td className="px-4 py-4">
                <RiskBadge rating={basket.riskRating} />
              </td>

              {/* Holdings */}
              <td className="px-4 py-4 text-right tabular-nums text-foreground font-medium">
                {basket.stockCount}
              </td>

              {/* Total Value */}
              <td className="px-4 py-4 text-right tabular-nums font-semibold text-foreground">
                {basket.totalValue > 0 ? formatCurrency(basket.totalValue) : (
                  <span className="text-muted-foreground font-normal text-xs">—</span>
                )}
              </td>

              {/* Created date */}
              <td className="px-4 py-4 text-xs text-muted-foreground tabular-nums">
                {new Date(basket.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </td>

              {/* Approval progress */}
              <td className="px-4 py-4">
                <ApprovalProgress approvers={basket.approvers} />
              </td>

              {/* Category */}
              <td className="px-4 py-4">
                <Badge variant="outline" className="text-xs text-muted-foreground border-border">
                  {basket.category}
                </Badge>
              </td>

              {/* Row actions (pinned to the right edge) */}
              <td
                className={`sticky right-0 z-10 px-4 py-4 text-right shadow-[-8px_0_8px_-6px_rgba(0,0,0,0.08)] ${
                  i % 2 === 0 ? "bg-card" : "bg-[oklch(0.968_0_0)]"
                }`}
              >
                <BasketRowActions
                  basket={basket}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
