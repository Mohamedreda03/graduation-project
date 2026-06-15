"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const [isRtl, setIsRtl] = React.useState(false)

  React.useLayoutEffect(() => {
    const checkRtl = () => {
      const dir = props.dir || document.documentElement.dir || document.body.dir || "ltr"
      setIsRtl(dir === "rtl")
    }
    checkRtl()
  }, [props.dir])

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full w-full flex-1 transition-all"
        style={{ transform: `translateX(${isRtl ? "" : "-"}${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
