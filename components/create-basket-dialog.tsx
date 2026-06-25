"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PlusIcon, TrashIcon, XIcon } from "lucide-react"
import type { Basket, Stock, Approver } from "@/lib/data"

interface CreateBasketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (basket: Omit<Basket, "id" | "createdAt" | "updatedAt" | "totalValue" | "stockCount">) => void
}

const APPROVER_OPTIONS = [
  { id: "a1", name: "James Thornton", role: "Chief Risk Officer", department: "Risk Management" },
  { id: "a2", name: "Linda Okafor", role: "Head of Compliance", department: "Compliance" },
  { id: "a3", name: "David Park", role: "Portfolio Director", department: "Investments" },
]

const RISK_RATINGS = ["Low", "Medium", "High"] as const
const CATEGORIES = ["Technology", "ESG / Energy", "Income", "International", "Healthcare", "Financials", "Other"]

const emptyStock = (): Partial<Stock> => ({
  ticker: "",
  name: "",
  sector: "",
  weight: 0,
  shares: 0,
  price: 0,
})

export function CreateBasketDialog({ open, onOpenChange, onSave }: CreateBasketDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("Technology")
  const [riskRating, setRiskRating] = useState<"Low" | "Medium" | "High">("Medium")
  const [stocks, setStocks] = useState<Partial<Stock>[]>([emptyStock()])
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const totalWeight = stocks.reduce((sum, s) => sum + (Number(s.weight) || 0), 0)

  const handleAddStock = () => {
    setStocks((prev) => [...prev, emptyStock()])
  }

  const handleRemoveStock = (index: number) => {
    setStocks((prev) => prev.filter((_, i) => i !== index))
  }

  const handleStockChange = (index: number, field: keyof Stock, value: string | number) => {
    setStocks((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const toggleApprover = (id: string) => {
    setSelectedApprovers((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = "Basket name is required."
    if (stocks.length === 0) newErrors.stocks = "Add at least one stock."
    if (stocks.some((s) => !s.ticker?.trim())) newErrors.tickers = "All stocks must have a ticker."
    if (Math.abs(totalWeight - 100) > 0.01 && totalWeight > 0) newErrors.weight = `Weights total ${totalWeight.toFixed(1)}% — must equal 100%.`
    if (selectedApprovers.length === 0) newErrors.approvers = "Select at least one approver."
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = (status: "Draft" | "Pending Approval") => {
    if (status === "Pending Approval" && !validate()) return

    const approvers: Approver[] = selectedApprovers.map((id) => {
      const opt = APPROVER_OPTIONS.find((a) => a.id === id)!
      return { id, name: opt.name, role: opt.role, department: opt.department, status: "Pending" }
    })

    onSave({
      name,
      description,
      category,
      riskRating,
      status,
      createdBy: "Current User",
      stocks: stocks.map((s, i) => ({
        id: `new-${i}`,
        ticker: s.ticker ?? "",
        name: s.name ?? "",
        sector: s.sector ?? "",
        weight: Number(s.weight) || 0,
        shares: Number(s.shares) || 0,
        price: Number(s.price) || 0,
        marketValue: (Number(s.shares) || 0) * (Number(s.price) || 0),
      })),
      approvers,
    })

    handleClose()
  }

  const handleClose = () => {
    setName("")
    setDescription("")
    setCategory("Technology")
    setRiskRating("Medium")
    setStocks([emptyStock()])
    setSelectedApprovers([])
    setErrors({})
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto font-sans">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Create New Custom Basket
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Define the basket composition and assign approvers before submitting for review.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-2">
          {/* ── Basket Details ─────────────────────────────────────── */}
          <section className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Basket Details
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Basket Name *</label>
                <input
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. US Tech Growth"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <textarea
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  rows={2}
                  placeholder="Brief description of the basket strategy..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <select
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Risk Rating</label>
                <div className="flex gap-2">
                  {RISK_RATINGS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRiskRating(r)}
                      className={`flex-1 h-9 rounded-md border text-sm font-medium transition-colors ${
                        riskRating === r
                          ? r === "Low"
                            ? "border-transparent bg-[var(--status-approved)] text-white"
                            : r === "Medium"
                            ? "border-transparent bg-[var(--status-pending)] text-white"
                            : "border-transparent bg-destructive text-white"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* ── Stock Composition ──────────────────────────────────── */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  Stock Composition
                </h3>
                <Badge
                  variant={Math.abs(totalWeight - 100) < 0.01 ? "default" : "secondary"}
                  className={`text-xs tabular-nums ${
                    Math.abs(totalWeight - 100) < 0.01
                      ? "bg-[var(--status-approved)] text-white border-transparent"
                      : totalWeight > 100
                      ? "bg-destructive text-white border-transparent"
                      : ""
                  }`}
                >
                  {totalWeight.toFixed(1)}% / 100%
                </Badge>
              </div>
              <Button size="sm" variant="outline" onClick={handleAddStock}>
                <PlusIcon data-icon="inline-start" />
                Add Stock
              </Button>
            </div>

            {errors.stocks && <p className="text-xs text-destructive">{errors.stocks}</p>}
            {errors.tickers && <p className="text-xs text-destructive">{errors.tickers}</p>}
            {errors.weight && <p className="text-xs text-destructive">{errors.weight}</p>}

            {/* Header row */}
            <div className="grid grid-cols-[80px_1fr_1fr_80px_80px_80px_32px] gap-2 px-1">
              {["Ticker", "Company Name", "Sector", "Weight%", "Shares", "Price ($)", ""].map((h) => (
                <span key={h} className="text-xs font-medium text-muted-foreground">{h}</span>
              ))}
            </div>

            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
              {stocks.map((stock, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[80px_1fr_1fr_80px_80px_80px_32px] gap-2 items-center"
                >
                  <input
                    className="h-8 rounded border border-border bg-background px-2 text-xs text-foreground uppercase placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="AAPL"
                    value={stock.ticker ?? ""}
                    onChange={(e) => handleStockChange(i, "ticker", e.target.value.toUpperCase())}
                  />
                  <input
                    className="h-8 rounded border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Apple Inc."
                    value={stock.name ?? ""}
                    onChange={(e) => handleStockChange(i, "name", e.target.value)}
                  />
                  <input
                    className="h-8 rounded border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Technology"
                    value={stock.sector ?? ""}
                    onChange={(e) => handleStockChange(i, "sector", e.target.value)}
                  />
                  <input
                    className="h-8 rounded border border-border bg-background px-2 text-xs text-foreground tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    placeholder="0"
                    value={stock.weight ?? ""}
                    onChange={(e) => handleStockChange(i, "weight", e.target.value)}
                  />
                  <input
                    className="h-8 rounded border border-border bg-background px-2 text-xs text-foreground tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={stock.shares ?? ""}
                    onChange={(e) => handleStockChange(i, "shares", e.target.value)}
                  />
                  <input
                    className="h-8 rounded border border-border bg-background px-2 text-xs text-foreground tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    value={stock.price ?? ""}
                    onChange={(e) => handleStockChange(i, "price", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveStock(i)}
                    className="flex size-8 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                    aria-label="Remove stock"
                  >
                    <TrashIcon className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* ── Approvers ──────────────────────────────────────────── */}
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Required Approvers
            </h3>
            {errors.approvers && <p className="text-xs text-destructive">{errors.approvers}</p>}

            <div className="flex flex-col gap-2">
              {APPROVER_OPTIONS.map((approver) => {
                const selected = selectedApprovers.includes(approver.id)
                return (
                  <button
                    key={approver.id}
                    type="button"
                    onClick={() => toggleApprover(approver.id)}
                    className={`flex items-center justify-between rounded-md border px-4 py-3 text-left transition-colors ${
                      selected
                        ? "border-accent bg-accent/10"
                        : "border-border bg-card hover:bg-muted"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">{approver.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {approver.role} · {approver.department}
                      </span>
                    </div>
                    {selected && (
                      <Badge className="bg-accent text-accent-foreground border-transparent text-xs">
                        Selected
                      </Badge>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        <DialogFooter className="flex gap-2 pt-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => handleSave("Draft")}>
            Save as Draft
          </Button>
          <Button onClick={() => handleSave("Pending Approval")}>
            Submit for Approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
