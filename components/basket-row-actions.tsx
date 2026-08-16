"use client"

import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  MoreHorizontalIcon,
  CopyIcon,
  Trash2Icon,
  LayersIcon,
  FileTextIcon,
  AlertTriangleIcon,
  CheckIcon,
} from "lucide-react"
import type { Basket } from "@/lib/data"

type DuplicateMode = "details" | "full"

interface BasketRowActionsProps {
  basket: Basket
  onDelete: (id: string) => void
  onDuplicate: (basket: Basket, mode: DuplicateMode) => void
}

export function BasketRowActions({ basket, onDelete, onDuplicate }: BasketRowActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [duplicateOpen, setDuplicateOpen] = useState(false)
  const [dupMode, setDupMode] = useState<DuplicateMode>("full")

  return (
    // Stop clicks anywhere in this subtree (menu + portaled dialogs bubble
    // through the React tree) from triggering the parent row's onClick.
    <div onClick={(e) => e.stopPropagation()}>
      {/* ── Trigger menu ──────────────────────────────────────────── */}
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Actions for ${basket.name}`}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <MoreHorizontalIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setDuplicateOpen(true)} className="gap-2">
              <CopyIcon className="size-4 text-muted-foreground" />
              Duplicate
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => setDeleteOpen(true)}
              className="gap-2 text-destructive data-highlighted:bg-destructive/10 data-highlighted:text-destructive"
            >
              <Trash2Icon className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Delete confirmation ───────────────────────────────────── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangleIcon className="size-5 text-destructive" />
            </div>
            <AlertDialogTitle>Delete &ldquo;{basket.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the basket along with its{" "}
              <span className="font-medium text-foreground">{basket.stocks.length} constituents</span> and{" "}
              <span className="font-medium text-foreground">{basket.approvers.length} approval records</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                onDelete(basket.id)
                setDeleteOpen(false)
              }}
            >
              <Trash2Icon data-icon="inline-start" />
              Delete basket
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Duplicate options ─────────────────────────────────────── */}
      <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Duplicate basket</DialogTitle>
            <DialogDescription>
              Create a copy of &ldquo;{basket.name}&rdquo;. Choose what to include in the new draft.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2.5 py-1">
            <DupOption
              active={dupMode === "full"}
              onClick={() => setDupMode("full")}
              icon={<LayersIcon className="size-4" />}
              title="Details + constituents"
              desc={`Copies basket details and all ${basket.stocks.length} holdings. Approvals reset to pending.`}
            />
            <DupOption
              active={dupMode === "details"}
              onClick={() => setDupMode("details")}
              icon={<FileTextIcon className="size-4" />}
              title="Details only"
              desc="Copies name, category, and risk rating with an empty holdings list."
            />
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button
              onClick={() => {
                onDuplicate(basket, dupMode)
                setDuplicateOpen(false)
              }}
            >
              <CopyIcon data-icon="inline-start" />
              Create duplicate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DupOption({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
        active
          ? "border-accent bg-accent/5 ring-1 ring-accent/30"
          : "border-border bg-card hover:bg-muted/50"
      }`}
    >
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-md ${
          active ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        {icon}
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground leading-relaxed">{desc}</span>
      </div>
      <div
        className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${
          active ? "border-accent bg-accent text-accent-foreground" : "border-border"
        }`}
      >
        {active && <CheckIcon className="size-3" />}
      </div>
    </button>
  )
}
