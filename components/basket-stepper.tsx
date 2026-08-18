"use client"

import { CheckIcon, XIcon } from "lucide-react"
import { WORKFLOW_STEPS, type WorkflowStage } from "@/lib/data"

export function BasketStepper({
  currentStage,
  rejected = false,
}: {
  currentStage: WorkflowStage
  rejected?: boolean
}) {
  const currentIndex = WORKFLOW_STEPS.findIndex((s) => s.stage === currentStage)

  return (
    <ol className="flex items-start" aria-label="Basket workflow progress">
      {WORKFLOW_STEPS.map((step, i) => {
        const isApprovalStep = step.stage === "approval"
        let state: "complete" | "current" | "upcoming" | "rejected" =
          i < currentIndex ? "complete" : i === currentIndex ? "current" : "upcoming"
        // A rejected basket flags the approval step as failed.
        if (rejected && isApprovalStep) state = "rejected"

        const circleClass = {
          complete: "bg-[var(--status-approved)] text-white border-transparent",
          current: "bg-accent text-accent-foreground border-transparent ring-4 ring-accent/20",
          upcoming: "bg-muted text-muted-foreground border-border",
          rejected: "bg-destructive text-white border-transparent ring-4 ring-destructive/20",
        }[state]

        const labelClass = {
          complete: "text-foreground",
          current: "text-foreground font-semibold",
          upcoming: "text-muted-foreground",
          rejected: "text-destructive font-semibold",
        }[state]

        const isLast = i === WORKFLOW_STEPS.length - 1

        return (
          <li
            key={step.stage}
            className={`flex items-start ${isLast ? "flex-none" : "flex-1"}`}
            aria-current={state === "current" ? "step" : undefined}
          >
            {/* Step marker + labels */}
            <div className="flex w-24 shrink-0 flex-col items-center gap-1.5 text-center">
              <div
                className={`flex size-8 items-center justify-center rounded-full border text-xs font-bold transition-colors ${circleClass}`}
              >
                {state === "complete" ? (
                  <CheckIcon className="size-4" />
                ) : state === "rejected" ? (
                  <XIcon className="size-4" />
                ) : (
                  i + 1
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className={`text-xs leading-tight ${labelClass}`}>{step.label}</span>
                <span className="text-[10px] leading-tight text-muted-foreground">
                  {step.caption}
                </span>
              </div>
            </div>

            {/* Connector to next step (aligned to circle center) */}
            {!isLast && (
              <div className="flex-1 pt-4">
                <div
                  className={`h-0.5 w-full rounded-full transition-colors ${
                    i < currentIndex ? "bg-[var(--status-approved)]" : "bg-border"
                  }`}
                />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
