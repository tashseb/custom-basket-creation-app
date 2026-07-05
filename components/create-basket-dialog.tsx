"use client"

import { useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PlusIcon, TrashIcon, ClipboardPasteIcon, ScaleIcon, HashIcon, LayersIcon, PieChartIcon } from "lucide-react"
import type { Basket, Stock, Approver } from "@/lib/data"

interface CreateBasketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (basket: Omit<Basket, "id" | "createdAt" | "updatedAt" | "totalValue" | "stockCount">) => void
}

// ─── Basket composition types ────────────────────────────────────────────────

type BasketType = "custom-weight" | "custom-qty" | "fixed-qty" | "equal-weight"

const BASKET_TYPE_LABELS: Record<BasketType, string> = {
  "custom-weight": "Custom Weight",
  "custom-qty": "Custom Quantity",
  "fixed-qty": "Fixed Quantity",
  "equal-weight": "Equal Weight",
}

const BASKET_TYPE_META: Record<
  BasketType,
  { icon: typeof ScaleIcon; blurb: string; valueLabel: string; twoColumn: boolean }
> = {
  "custom-weight": {
    icon: ScaleIcon,
    blurb: "Assign a specific weight (%) to each stock. Weights must total 100%.",
    valueLabel: "Weight %",
    twoColumn: true,
  },
  "custom-qty": {
    icon: HashIcon,
    blurb: "Assign a specific share quantity to each stock.",
    valueLabel: "Quantity",
    twoColumn: true,
  },
  "fixed-qty": {
    icon: LayersIcon,
    blurb: "Apply one fixed share quantity to every stock in the basket.",
    valueLabel: "Quantity",
    twoColumn: false,
  },
  "equal-weight": {
    icon: PieChartIcon,
    blurb: "Split the basket evenly — every stock receives the same weight.",
    valueLabel: "Weight %",
    twoColumn: false,
  },
}

const RISK_RATINGS = ["Low", "Medium", "High"] as const
const CATEGORIES = ["Technology", "ESG / Energy", "Income", "International", "Healthcare", "Financials", "Other"]

const APPROVER_OPTIONS = [
  { id: "a1", name: "James Thornton", role: "Chief Risk Officer", department: "Risk Management" },
  { id: "a2", name: "Linda Okafor", role: "Head of Compliance", department: "Compliance" },
  { id: "a3", name: "David Park", role: "Portfolio Director", department: "Investments" },
]

// ─── Row model for the composition table ─────────────────────────────────────

interface CompRow {
  code: string
  value: string // meaning depends on type: weight% or quantity
}

const emptyRow = (): CompRow => ({ code: "", value: "" })

/**
 * Parse text pasted from Excel / Sheets into rows.
 * Handles tab, comma, or multi-space delimited columns and skips header rows.
 */
function parsePasted(text: string, twoColumn: boolean): CompRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const rows: CompRow[] = []
  for (const line of lines) {
    const parts = line.split(/\t|,|\s{2,}|\s+/).filter(Boolean)
    if (parts.length === 0) continue

    const code = parts[0]
    const value = twoColumn ? (parts[1] ?? "") : ""

    // Skip obvious header rows (e.g. "Stock Code  Weight")
    const looksLikeHeader =
      /^(stock|code|ticker|symbol|security)$/i.test(code) ||
      (twoColumn && parts[1] && /^(weight|qty|quantity|shares|value|%)$/i.test(parts[1]))
    if (looksLikeHeader) continue

    rows.push({ code: code.toUpperCase(), value })
  }
  return rows
}

export function CreateBasketDialog({ open, onOpenChange, onSave }: CreateBasketDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("Technology")
  const [riskRating, setRiskRating] = useState<"Low" | "Medium" | "High">("Medium")

  const [basketType, setBasketType] = useState<BasketType>("custom-weight")
  const [rows, setRows] = useState<CompRow[]>([emptyRow()])
  const [fixedQty, setFixedQty] = useState("")
  const [pasteText, setPasteText] = useState("")

  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const meta = BASKET_TYPE_META[basketType]

  const validRows = useMemo(() => rows.filter((r) => r.code.trim()), [rows])

  const totalWeight = useMemo(() => {
    if (basketType === "custom-weight") {
      return rows.reduce((sum, r) => sum + (Number(r.value) || 0), 0)
    }
    if (basketType === "equal-weight") {
      return validRows.length > 0 ? 100 : 0
    }
    return 0
  }, [rows, validRows, basketType])

  const totalShares = useMemo(() => {
    if (basketType === "custom-qty") return rows.reduce((s, r) => s + (Number(r.value) || 0), 0)
    if (basketType === "fixed-qty") return validRows.length * (Number(fixedQty) || 0)
    return 0
  }, [rows, validRows, basketType, fixedQty])

  // ── Row handlers ──────────────────────────────────────────────────────────
  const handleAddRow = () => setRows((prev) => [...prev, emptyRow()])
  const handleRemoveRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i))
  const handleRowChange = (i: number, field: keyof CompRow, val: string) =>
    setRows((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: field === "code" ? val.toUpperCase() : val }
      return next
    })

  const handleApplyPaste = () => {
    const parsed = parsePasted(pasteText, meta.twoColumn)
    if (parsed.length === 0) return
    setRows(parsed)
    setPasteText("")
    setErrors((e) => ({ ...e, rows: "", paste: "" }))
  }

  const handleTypeChange = (val: BasketType) => {
    setBasketType(val)
    // Keep codes but clear per-row values that no longer apply
    setRows((prev) => prev.map((r) => ({ ...r, value: "" })))
    setPasteText("")
    setErrors({})
  }

  const toggleApprover = (id: string) =>
    setSelectedApprovers((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]))

  // ── Validation ──────────────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = "Basket name is required."
    if (validRows.length === 0) e.rows = "Add at least one stock code."

    if (basketType === "custom-weight") {
      if (Math.abs(totalWeight - 100) > 0.01) e.weight = `Weights total ${totalWeight.toFixed(1)}% — must equal 100%.`
      if (validRows.some((r) => !r.value || Number(r.value) <= 0)) e.values = "Every stock needs a weight greater than 0."
    }
    if (basketType === "custom-qty") {
      if (validRows.some((r) => !r.value || Number(r.value) <= 0)) e.values = "Every stock needs a quantity greater than 0."
    }
    if (basketType === "fixed-qty") {
      if (!fixedQty || Number(fixedQty) <= 0) e.fixedQty = "Enter a fixed quantity greater than 0."
    }
    if (selectedApprovers.length === 0) e.approvers = "Select at least one approver."

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const buildStocks = (): Stock[] =>
    validRows.map((r, i) => {
      const code = r.code.toUpperCase()
      let weight = 0
      let shares = 0
      if (basketType === "custom-weight") weight = Number(r.value) || 0
      if (basketType === "equal-weight") weight = 100 / validRows.length
      if (basketType === "custom-qty") shares = Number(r.value) || 0
      if (basketType === "fixed-qty") shares = Number(fixedQty) || 0
      return {
        id: `new-${i}`,
        ticker: code,
        name: code,
        sector: "—",
        weight: Number(weight.toFixed(2)),
        shares,
        price: 0,
        marketValue: 0,
      }
    })

  const handleSave = (status: "Draft" | "Pending Approval") => {
    if (status === "Pending Approval" && !validate()) return
    // Drafts only need a name
    if (status === "Draft" && !name.trim()) {
      setErrors({ name: "Basket name is required." })
      return
    }

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
      createdBy: "Sarah Mitchell",
      stocks: buildStocks(),
      approvers,
    })
    handleClose()
  }

  const handleClose = () => {
    setName("")
    setDescription("")
    setCategory("Technology")
    setRiskRating("Medium")
    setBasketType("custom-weight")
    setRows([emptyRow()])
    setFixedQty("")
    setPasteText("")
    setSelectedApprovers([])
    setErrors({})
    onOpenChange(false)
  }

  const TypeIcon = meta.icon

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto font-sans">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">Create New Basket</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose a composition method, then define the holdings and assign approvers.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-2">
          {/* ── Composition method ─────────────────────────────────── */}
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Composition Method</h3>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground">Basket Type *</label>
              <Select value={basketType} onValueChange={(v) => handleTypeChange(v as BasketType)} items={BASKET_TYPE_LABELS}>
                <SelectTrigger className="w-full h-11 text-base sm:text-sm">
                  <SelectValue placeholder="Select a basket type" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(BASKET_TYPE_LABELS) as BasketType[]).map((t) => (
                    <SelectItem key={t} value={t} className="py-2.5">
                      {BASKET_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2.5 text-xs text-foreground">
                <TypeIcon className="size-4 shrink-0 text-accent mt-0.5" />
                <span className="leading-relaxed">{meta.blurb}</span>
              </div>
            </div>
          </section>

          <Separator />

          {/* ── Basket details ─────────────────────────────────────── */}
          <section className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Basket Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Basket Name *</label>
                <input
                  className="h-11 sm:h-9 rounded-md border border-border bg-background px-3 text-base sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. US Tech Growth"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <textarea
                  className="rounded-md border border-border bg-background px-3 py-2 text-base sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  rows={2}
                  placeholder="Brief description of the basket strategy..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <select
                  className="h-11 sm:h-9 rounded-md border border-border bg-background px-3 text-base sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                      className={`flex-1 h-11 sm:h-9 rounded-md border text-sm font-medium transition-colors ${
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

          {/* ── Composition input (varies by type) ─────────────────── */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Holdings</h3>
              {basketType === "custom-weight" && (
                <Badge
                  className={`text-xs tabular-nums border-transparent ${
                    Math.abs(totalWeight - 100) < 0.01
                      ? "bg-[var(--status-approved)] text-white"
                      : totalWeight > 100
                      ? "bg-destructive text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {totalWeight.toFixed(1)}% / 100%
                </Badge>
              )}
              {(basketType === "custom-qty" || basketType === "fixed-qty") && totalShares > 0 && (
                <Badge className="text-xs tabular-nums border-transparent bg-muted text-muted-foreground">
                  {totalShares.toLocaleString()} shares total
                </Badge>
              )}
              {basketType === "equal-weight" && validRows.length > 0 && (
                <Badge className="text-xs tabular-nums border-transparent bg-muted text-muted-foreground">
                  {(100 / validRows.length).toFixed(2)}% each
                </Badge>
              )}
            </div>

            {/* Fixed quantity input (fixed-qty only) */}
            {basketType === "fixed-qty" && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Fixed Quantity (applied to all stocks) *</label>
                <input
                  type="number"
                  min={0}
                  className="h-11 sm:h-9 w-full sm:w-48 rounded-md border border-border bg-background px-3 text-base sm:text-sm text-foreground tabular-nums placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. 1000"
                  value={fixedQty}
                  onChange={(e) => setFixedQty(e.target.value)}
                />
                {errors.fixedQty && <p className="text-xs text-destructive">{errors.fixedQty}</p>}
              </div>
            )}

            {/* Excel paste box */}
            <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <ClipboardPasteIcon className="size-4 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Paste from Excel</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {meta.twoColumn
                  ? `Paste two columns from your spreadsheet: stock code and ${meta.valueLabel.toLowerCase()}. Tabs, commas, or spaces all work.`
                  : "Paste a single column of stock codes, one per line."}
              </p>
              <textarea
                className="rounded-md border border-border bg-background px-3 py-2 font-mono text-base sm:text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                rows={3}
                placeholder={
                  meta.twoColumn
                    ? `AAPL${"\t"}${basketType === "custom-weight" ? "25" : "1000"}\nMSFT${"\t"}${basketType === "custom-weight" ? "30" : "800"}\nNVDA${"\t"}${basketType === "custom-weight" ? "45" : "500"}`
                    : "AAPL\nMSFT\nNVDA"
                }
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
              />
              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={handleApplyPaste} disabled={!pasteText.trim()}>
                  <ClipboardPasteIcon data-icon="inline-start" />
                  Parse &amp; fill table
                </Button>
              </div>
            </div>

            {errors.rows && <p className="text-xs text-destructive">{errors.rows}</p>}
            {errors.values && <p className="text-xs text-destructive">{errors.values}</p>}
            {errors.weight && <p className="text-xs text-destructive">{errors.weight}</p>}

            {/* Editable parsed table */}
            <div className="flex flex-col gap-2">
              <div
                className={`grid gap-2 px-1 ${meta.twoColumn ? "grid-cols-[1fr_120px_32px]" : "grid-cols-[1fr_32px]"}`}
              >
                <span className="text-xs font-medium text-muted-foreground">Stock Code</span>
                {meta.twoColumn && (
                  <span className="text-xs font-medium text-muted-foreground">{meta.valueLabel}</span>
                )}
                <span />
              </div>

              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                {rows.map((row, i) => (
                  <div
                    key={i}
                    className={`grid gap-2 items-center ${meta.twoColumn ? "grid-cols-[1fr_120px_32px]" : "grid-cols-[1fr_32px]"}`}
                  >
                    <input
                      className="h-11 sm:h-9 rounded border border-border bg-background px-2 text-base sm:text-sm text-foreground uppercase placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      placeholder="AAPL"
                      value={row.code}
                      onChange={(e) => handleRowChange(i, "code", e.target.value)}
                    />
                    {meta.twoColumn && (
                      <input
                        type="number"
                        min={0}
                        step={basketType === "custom-weight" ? 0.1 : 1}
                        className="h-11 sm:h-9 rounded border border-border bg-background px-2 text-base sm:text-sm text-foreground tabular-nums placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder={basketType === "custom-weight" ? "0.0" : "0"}
                        value={row.value}
                        onChange={(e) => handleRowChange(i, "value", e.target.value)}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(i)}
                      className="flex size-11 sm:size-9 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                      aria-label="Remove stock"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                ))}
              </div>

              <Button size="sm" variant="outline" onClick={handleAddRow} className="self-start">
                <PlusIcon data-icon="inline-start" />
                Add Stock
              </Button>
            </div>
          </section>

          <Separator />

          {/* ── Approvers ──────────────────────────────────────────── */}
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Required Approvers</h3>
            {errors.approvers && <p className="text-xs text-destructive">{errors.approvers}</p>}
            <div className="flex flex-col gap-2">
              {APPROVER_OPTIONS.map((approver) => {
                const selected = selectedApprovers.includes(approver.id)
                return (
                  <button
                    key={approver.id}
                    type="button"
                    onClick={() => toggleApprover(approver.id)}
                    className={`flex items-center justify-between rounded-md border px-4 py-3 text-left transition-colors min-h-11 ${
                      selected ? "border-accent bg-accent/10" : "border-border bg-card hover:bg-muted"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">{approver.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {approver.role} · {approver.department}
                      </span>
                    </div>
                    {selected && (
                      <Badge className="bg-accent text-accent-foreground border-transparent text-xs">Selected</Badge>
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
          <Button onClick={() => handleSave("Pending Approval")}>Submit for Approval</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
