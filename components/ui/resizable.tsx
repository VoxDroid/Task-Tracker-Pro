"use client"

import { GripVertical } from "lucide-react"

import { cn } from "@/lib/utils"

// Temporarily disabled due to TypeScript issues with react-resizable-panels v4
// TODO: Fix when shadcn/ui updates their resizable component

const ResizablePanelGroup = ({
  className,
  ...props
}: any) => (
  <div
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
)

const ResizablePanel = ({
  className,
  ...props
}: any) => (
  <div
    className={cn("flex-1", className)}
    {...props}
  />
)

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: any) => (
  <div
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </div>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
