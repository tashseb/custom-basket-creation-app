"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  BuildingIcon,
  ListIcon,
  ShieldCheckIcon,
  LayersIcon,
  LockIcon,
  MailIcon,
  ArrowLeftIcon,
} from "lucide-react"
import type { Basket, ApproverStatus, BasketStatus, Approver, Viewer } from "@/lib/data"
import Link from "next/link"

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function todayISO() {
  return new Date().toISOString().split("T")[0]
}

function deriveStatus(approvers: Approver[], current: BasketStatus): BasketStatus {
  if (current === "Draft") return "Draft"
  if (approvers.some((a) => a.status === "Rejected")) return "Rejected"
  if (approvers.length > 0 && approvers.every((a) => a.status === "Approved")) return "Active"
  return "Pending Approval"
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BasketStatus }) {
  const map: Record<BasketStatus, { label: string; cls: string }> = {
    Active: { label: "Active", cls: "bg-[var(--status-approved)] text-white border-transparent" },
    "Pending Approval": { label: "Pending Approval", cls: "bg-[var(--status-pending)] text-white border-transparent" },
    Draft: { label: "Draft", cls: "bg-muted text-muted-foreground border-border" },
    Rejected: { label: "Rejected", cls: "bg-destructive text-white border-transparent" },
  }
  const { label, cls } = map[status]
  return <Badge className={`text-xs font-medium ${cls}`}>{label}</Badge>
}

function RiskBadge({ rating }: { rating: "Low" | "Medium" | "High" }) {
  const map = {
    Low: "bg-[var(--status-approved)]/15 text-[var(--status-approved)] border-[var(--status-approved)]/30",
    Medium: "bg-[var(--status-pending)]/15 text-[var(--status-pending)] border-[var(--status-pending)]/30",
    High: "bg-destructive/15 text-destructive border-destructive/30",
  }
  return (
    <Badge variant="outline" className={`text-xs ${map[rating]}`}>
      {rating} Risk
    </Badge>
  )
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
  return (
    <Badge variant="outline" className={`text-xs ${map[status]}`}>
      {status}
    </Badge>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

interface BasketReviewPageProps {
  initialBasket: Basket
  viewer: Viewer
}

export function BasketReviewPage({ initialBasket, viewer }: BasketReviewPageProps) {
  const [basket, setBasket] = useState<Basket>(initialBasket)
  const [commentDraft, setCommentDraft] = useState("")
  const [activeTab, setActiveTab] = useState<"holdings" | "approvals">("approvals")
  const [decided, setDecided] = useState(false)

  const myApprover = basket.approvers.find((a) => a.name === viewer.name)
  const approvedCount = basket.approvers.filter((a) => a.status === "Approved").length
  const totalApprovers = basket.approvers.length
  const canApprove =
    Boolean(myApprover) &&
    basket.status === "Pending Approval" &&
    myApprover?.status === "Pending"

  // If the approver already decided before arriving, reflect that immediately
  useEffect(() => {
    if (myApprover?.status !== "Pending") setDecided(true)
  }, [myApprover?.status])

  function handleDecision(decision: "Approved" | "Rejected") {
    if (!myApprover) return
    const updatedApprovers = basket.approvers.map((a) =>
      a.id === myApprover.id
        ? { ...a, status: decision, reviewedAt: todayISO(), comment: commentDraft.trim() || a.comment }
        : a
    )
    setBasket({
      ...basket,
      approvers: updatedApprovers,
      status: deriveStatus(updatedApprovers, basket.status),
      updatedAt: todayISO(),
    })
    setCommentDraft("")
    setDecided(true)
  }

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">

      {/* ── Top nav — locked identity ──────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur-sm shrink-0">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeftIcon className="size-4" />
              <span className="text-xs font-medium">Back to Basket Manager</span>
            </Link>
          </div>

          {/* Locked identity pill */}
          <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/60 px-3 py-1.5">
            <div className="flex size-7 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <ShieldCheckIcon className="size-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground leading-none">
                {viewer.name}
              </span>
              <span className="text-[11px] text-muted-foreground leading-none mt-0.5">
                {viewer.title}
              </span>
            </div>
            <div className="flex items-center gap-1 ml-1 rounded-md border border-border bg-muted px-1.5 py-0.5">
              <LockIcon className="size-2.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">Locked</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Email notification banner ──────────────────────────────── */}
      <div className="border-b border-border bg-accent/5 shrink-0">
        <div className="mx-auto max-w-5xl px-6 py-3 flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/15 mt-0.5">
            <MailIcon className="size-4 text-accent" />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-semibold text-foreground">
              You received an approval request for this basket
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">{basket.createdBy}</span> has submitted{" "}
              <span className="font-medium text-foreground">{basket.name}</span> for approval and requires your review.
              {canApprove
                ? " Please review the stock holdings and submit your decision below."
                : myApprover?.status !== "Pending"
                ? ` You have already ${myApprover?.status?.toLowerCase()} this request.`
                : " This basket is not currently open for review."}
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl px-6 py-6 flex flex-col gap-6 flex-1">

        {/* ── Basket header ──────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-6 py-5 shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={basket.status} />
            <RiskBadge rating={basket.riskRating} />
            <Badge variant="outline" className="text-xs text-muted-foreground border-border">
              {basket.category}
            </Badge>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-bold text-foreground text-balance">{basket.name}</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">{basket.description}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0 text-right">
              <span className="text-xs text-muted-foreground">Total value</span>
              <span className="text-lg font-bold text-foreground tabular-nums">
                {formatCurrency(basket.totalValue)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 pt-1 border-t border-border text-xs text-muted-foreground">
            <span>Created by <span className="font-medium text-foreground">{basket.createdBy}</span></span>
            <span className="opacity-30">·</span>
            <span>Submitted {formatDate(basket.createdAt)}</span>
            <span className="opacity-30">·</span>
            <span>Basket ID: <span className="font-mono">{basket.id}</span></span>
          </div>
        </div>

        {/* ── Post-decision confirmation banner ──────────────────────── */}
        {decided && myApprover && myApprover.status !== "Pending" && (
          <div
            className={`flex items-center gap-3 rounded-xl border px-5 py-4 ${
              myApprover.status === "Approved"
                ? "border-[var(--status-approved)]/30 bg-[var(--status-approved)]/5"
                : "border-destructive/30 bg-destructive/5"
            }`}
          >
            {myApprover.status === "Approved"
              ? <CheckCircleIcon className="size-5 shrink-0 text-[var(--status-approved)]" />
              : <XCircleIcon className="size-5 shrink-0 text-destructive" />
            }
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground">
                You have {myApprover.status === "Approved" ? "approved" : "rejected"} this basket
              </span>
              <span className="text-xs text-muted-foreground">
                Your decision was recorded on {formatDate(myApprover.reviewedAt!)}. The submission team has been notified.
              </span>
            </div>
          </div>
        )}

        {/* ── Tabs: Holdings + Approval Chain ────────────────────────── */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "holdings" | "approvals")}
          className="flex flex-col flex-1"
        >
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

          {/* ── Holdings (read-only) ──────────────────────────────── */}
          <TabsContent value="holdings" className="mt-4">
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
                      <td className="px-3 py-3 text-sm text-foreground">{stock.name}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{stock.sector}</td>
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

          {/* ── Approval Chain ────────────────────────────────────── */}
          <TabsContent value="approvals" className="mt-4 flex flex-col gap-4">
            {/* Progress bar */}
            <div className="flex items-center gap-3">
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
              {basket.approvers.map((approver, i) => {
                const isMe = approver.name === viewer.name
                const showActions = isMe && canApprove && !decided

                return (
                  <div
                    key={approver.id}
                    className={`rounded-xl border px-5 py-4 transition-all ${
                      isMe
                        ? "border-accent/50 bg-accent/5 ring-1 ring-accent/20 shadow-sm"
                        : "border-border bg-card opacity-60"
                    }`}
                  >
                    {/* Read-only overlay label for other rows */}
                    {!isMe && (
                      <div className="flex items-center gap-1.5 mb-3 text-[11px] text-muted-foreground/70">
                        <LockIcon className="size-3" />
                        <span>Read-only — not your approval step</span>
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      {/* Step number */}
                      <div
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5 ${
                          isMe ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {i + 1}
                      </div>

                      <div className="flex flex-1 flex-col gap-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">
                                {approver.name}
                              </span>
                              {isMe && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-accent/40 text-accent px-1.5 py-0"
                                >
                                  You
                                </Badge>
                              )}
                            </div>
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

                        {/* ── Action panel — only on viewer's own pending row ── */}
                        {showActions && (
                          <div className="mt-2 flex flex-col gap-3 rounded-lg border border-dashed border-accent/40 bg-background p-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-semibold text-foreground">
                                Your decision
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Add an optional comment before approving or rejecting.
              </span>
                            </div>
                            <Textarea
                              value={commentDraft}
                              onChange={(e) => setCommentDraft(e.target.value)}
                              rows={3}
                              placeholder="Add a comment (optional)…"
                              className="resize-none text-sm"
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="bg-[var(--status-approved)] text-white hover:bg-[var(--status-approved)]/90"
                                onClick={() => handleDecision("Approved")}
                              >
                                <CheckCircleIcon data-icon="inline-start" />
                                Approve basket
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDecision("Rejected")}
                              >
                                <XCircleIcon data-icon="inline-start" />
                                Reject basket
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
