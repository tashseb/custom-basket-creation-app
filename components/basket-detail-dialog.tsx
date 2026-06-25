"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  BuildingIcon,
  ListIcon,
  ShieldCheckIcon,
  PencilIcon,
  SaveIcon,
  XIcon,
  InfoIcon,
  UserIcon,
} from "lucide-react"
import type { Basket, ApproverStatus, BasketStatus, Approver, Viewer } from "@/lib/data"

interface BasketDetailDialogProps {
  basket: Basket | null
  open: boolean
  onOpenChange: (open: boolean) => void
  viewer: Viewer
  onUpdateBasket: (basket: Basket) => void
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

function todayISO() {
  return new Date().toISOString().split("T")[0]
}

// Recompute basket status from its approver decisions.
function deriveStatus(approvers: Approver[], current: BasketStatus): BasketStatus {
  if (current === "Draft") return "Draft"
  if (approvers.some((a) => a.status === "Rejected")) return "Rejected"
  if (approvers.length > 0 && approvers.every((a) => a.status === "Approved")) return "Active"
  return "Pending Approval"
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

export function BasketDetailDialog({
  basket,
  open,
  onOpenChange,
  viewer,
  onUpdateBasket,
}: BasketDetailDialogProps) {
  // ── Local edit state (creator: name + description) ──────────────
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState("")
  const [draftDesc, setDraftDesc] = useState("")

  // ── Local approver action state ─────────────────────────────────
  const [commentDraft, setCommentDraft] = useState("")

  // Reset local state whenever the basket or viewer changes.
  useEffect(() => {
    if (basket) {
      setDraftName(basket.name)
      setDraftDesc(basket.description)
    }
    setEditing(false)
    setCommentDraft("")
  }, [basket, viewer])

  if (!basket) return null

  const approvedCount = basket.approvers.filter((a) => a.status === "Approved").length
  const totalApprovers = basket.approvers.length

  const isCreator = viewer.role === "user"
  const myApprover = basket.approvers.find((a) => a.name === viewer.name)
  const isRequiredApprover = viewer.role === "approver" && Boolean(myApprover)
  const canApprove =
    isRequiredApprover && basket.status === "Pending Approval" && myApprover?.status === "Pending"

  // Creator may edit name/description on a real (created) basket.
  const canEditDetails = isCreator

  function handleSaveDetails() {
    if (!basket) return
    onUpdateBasket({ ...basket, name: draftName.trim() || basket.name, description: draftDesc.trim() })
    setEditing(false)
  }

  function handleApproverDecision(decision: "Approved" | "Rejected") {
    if (!basket || !myApprover) return
    const updatedApprovers = basket.approvers.map((a) =>
      a.id === myApprover.id
        ? {
            ...a,
            status: decision,
            reviewedAt: todayISO(),
            comment: commentDraft.trim() || a.comment,
          }
        : a
    )
    onUpdateBasket({
      ...basket,
      approvers: updatedApprovers,
      status: deriveStatus(updatedApprovers, basket.status),
    })
    setCommentDraft("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1100px] max-h-[90vh] flex flex-col overflow-hidden font-sans p-0">

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

              {editing ? (
                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="basket-name" className="text-xs font-medium text-muted-foreground">
                      Basket name
                    </label>
                    <Input
                      id="basket-name"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      className="text-base font-semibold"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="basket-desc" className="text-xs font-medium text-muted-foreground">
                      Description
                    </label>
                    <Textarea
                      id="basket-desc"
                      value={draftDesc}
                      onChange={(e) => setDraftDesc(e.target.value)}
                      rows={2}
                      className="resize-none text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Button size="sm" onClick={handleSaveDetails} disabled={!draftName.trim()}>
                      <SaveIcon data-icon="inline-start" />
                      Save changes
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(false)
                        setDraftName(basket.name)
                        setDraftDesc(basket.description)
                      }}
                    >
                      <XIcon data-icon="inline-start" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-xl font-semibold text-foreground">
                      {basket.name}
                    </DialogTitle>
                    {canEditDetails && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-muted-foreground"
                        onClick={() => setEditing(true)}
                      >
                        <PencilIcon data-icon="inline-start" />
                        Edit
                      </Button>
                    )}
                  </div>
                  <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                    {basket.description}
                  </DialogDescription>
                </>
              )}
            </div>
          </DialogHeader>

          {/* ── Role / permission banner ─────────────────────────── */}
          <RoleBanner
            isCreator={isCreator}
            isRequiredApprover={isRequiredApprover}
            canApprove={canApprove}
            viewer={viewer}
            myStatus={myApprover?.status}
            basketStatus={basket.status}
          />
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

          {/* ── Stock Holdings Tab (read-only for everyone) ────── */}
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
              {basket.approvers.map((approver, i) => {
                const isMe = viewer.role === "approver" && approver.name === viewer.name
                const showActions = isMe && canApprove
                return (
                  <div
                    key={approver.id}
                    className={`flex items-start gap-4 rounded-lg border px-5 py-4 ${
                      isMe ? "border-accent/50 bg-accent/5 ring-1 ring-accent/20" : "border-border bg-card"
                    }`}
                  >
                    {/* Step number */}
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground mt-0.5">
                      {i + 1}
                    </div>

                    {/* Body */}
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground leading-tight">
                              {approver.name}
                            </span>
                            {isMe && (
                              <Badge variant="outline" className="text-[10px] border-accent/40 text-accent px-1.5 py-0">
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

                      {/* Approver action panel — only on the viewer's own row */}
                      {showActions && (
                        <div className="mt-2 flex flex-col gap-2 rounded-md border border-dashed border-accent/40 bg-card p-3">
                          <span className="text-xs font-medium text-foreground">
                            Your decision
                          </span>
                          <Textarea
                            value={commentDraft}
                            onChange={(e) => setCommentDraft(e.target.value)}
                            rows={2}
                            placeholder="Add a comment (optional)…"
                            className="resize-none text-sm"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="bg-[var(--status-approved)] text-white hover:bg-[var(--status-approved)]/90"
                              onClick={() => handleApproverDecision("Approved")}
                            >
                              <CheckCircleIcon data-icon="inline-start" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleApproverDecision("Rejected")}
                            >
                              <XCircleIcon data-icon="inline-start" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
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

function RoleBanner({
  isCreator,
  isRequiredApprover,
  canApprove,
  viewer,
  myStatus,
  basketStatus,
}: {
  isCreator: boolean
  isRequiredApprover: boolean
  canApprove: boolean
  viewer: Viewer
  myStatus?: ApproverStatus
  basketStatus: BasketStatus
}) {
  let icon = <InfoIcon className="size-4 shrink-0" />
  let tone = "border-border bg-muted/50 text-muted-foreground"
  let message = ""

  if (isCreator) {
    icon = <UserIcon className="size-4 shrink-0 text-primary" />
    tone = "border-primary/20 bg-primary/5 text-foreground"
    message =
      "Viewing as the creator. You can edit the basket name and description. Holdings and approvals are read-only."
  } else if (isRequiredApprover) {
    if (canApprove) {
      icon = <ShieldCheckIcon className="size-4 shrink-0 text-accent" />
      tone = "border-accent/30 bg-accent/5 text-foreground"
      message =
        "You are a required approver. Review the holdings, then approve or reject in the Approval Chain tab."
    } else if (myStatus && myStatus !== "Pending") {
      icon = <CheckCircleIcon className="size-4 shrink-0 text-[var(--status-approved)]" />
      tone = "border-border bg-muted/50 text-muted-foreground"
      message = `You have already ${myStatus.toLowerCase()} this basket. Your decision is recorded below.`
    } else {
      message = `This basket is ${basketStatus}. No approval action is required from you right now.`
    }
  } else {
    icon = <InfoIcon className="size-4 shrink-0" />
    message = `Viewing as ${viewer.name}. You are not a required approver for this basket — view only.`
  }

  return (
    <div className={`mt-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs leading-relaxed ${tone}`}>
      {icon}
      <span>{message}</span>
    </div>
  )
}
