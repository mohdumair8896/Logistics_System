"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const monthlyPerformanceData = [
  { month: "April", tonnage: 420, efficiency: 86 },
  { month: "May", tonnage: 510, efficiency: 89 },
  { month: "June", tonnage: 590, efficiency: 91 },
  { month: "July", tonnage: 680, efficiency: 94 },
  { month: "August", tonnage: 760, efficiency: 96 },
  { month: "September", tonnage: 895, efficiency: 98 },
]

const chartConfig = {
  tonnage: {
    label: "Payload (Tons)",
    color: "var(--chart-1)",
  },
  efficiency: {
    label: "Efficiency Score",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

export function FleetPerformanceGradientChart() {
  return (
    <Card className="w-full flex flex-col justify-between h-full">
      <CardHeader className="pb-3 pt-5 px-5">
        <CardTitle>Freight Volume & Dispatch Efficiency</CardTitle>
        <CardDescription>
          Cumulative metric comparison over the last 6 operating months
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 px-3 sm:px-5 pb-0 flex-1 flex flex-col justify-center">
        <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
          <AreaChart
            accessibilityLayer
            data={monthlyPerformanceData}
            margin={{ left: 10, right: 10, top: 8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillTonnage" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-tonnage)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-tonnage)"
                  stopOpacity={0.08}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Area
              dataKey="tonnage"
              type="natural"
              fill="url(#fillTonnage)"
              stroke="var(--color-tonnage)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="border-t border-[var(--border)] pt-3.5 pb-4 px-5">
        <div className="flex w-full items-center justify-between text-xs">
          <div className="grid gap-0.5">
            <div className="flex items-center gap-1.5 font-semibold text-[var(--success)] leading-tight">
              Fleet payload up by 17.8% this month <TrendingUp className="h-3.5 w-3.5" />
            </div>
            <div className="text-[var(--text-low)] leading-tight">
              Peak operational throughput — April to September 2026
            </div>
          </div>
          <div className="text-[var(--text-low)] font-medium hidden sm:block">
            Efficiency: 98%
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
