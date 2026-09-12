"use client"

import * as React from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// 90-day operational telemetry trend data for logistics operations
const rawFleetData = [
  { date: "2026-06-15", inTransit: 18, delivered: 42 },
  { date: "2026-06-18", inTransit: 22, delivered: 48 },
  { date: "2026-06-21", inTransit: 25, delivered: 55 },
  { date: "2026-06-24", inTransit: 29, delivered: 51 },
  { date: "2026-06-27", inTransit: 34, delivered: 62 },
  { date: "2026-06-30", inTransit: 31, delivered: 58 },
  { date: "2026-07-03", inTransit: 28, delivered: 64 },
  { date: "2026-07-06", inTransit: 38, delivered: 71 },
  { date: "2026-07-09", inTransit: 42, delivered: 76 },
  { date: "2026-07-12", inTransit: 39, delivered: 82 },
  { date: "2026-07-15", inTransit: 45, delivered: 89 },
  { date: "2026-07-18", inTransit: 48, delivered: 85 },
  { date: "2026-07-21", inTransit: 52, delivered: 94 },
  { date: "2026-07-24", inTransit: 49, delivered: 98 },
  { date: "2026-07-27", inTransit: 56, delivered: 104 },
  { date: "2026-07-30", inTransit: 53, delivered: 101 },
  { date: "2026-08-02", inTransit: 58, delivered: 110 },
  { date: "2026-08-05", inTransit: 62, delivered: 115 },
  { date: "2026-08-08", inTransit: 60, delivered: 121 },
  { date: "2026-08-11", inTransit: 65, delivered: 128 },
  { date: "2026-08-14", inTransit: 68, delivered: 132 },
  { date: "2026-08-17", inTransit: 64, delivered: 125 },
  { date: "2026-08-20", inTransit: 71, delivered: 139 },
  { date: "2026-08-23", inTransit: 75, delivered: 144 },
  { date: "2026-08-26", inTransit: 72, delivered: 140 },
  { date: "2026-08-29", inTransit: 78, delivered: 152 },
  { date: "2026-09-01", inTransit: 82, delivered: 158 },
  { date: "2026-09-04", inTransit: 80, delivered: 161 },
  { date: "2026-09-07", inTransit: 86, delivered: 170 },
  { date: "2026-09-10", inTransit: 91, delivered: 178 },
  { date: "2026-09-12", inTransit: 94, delivered: 185 },
]

const chartConfig = {
  inTransit: {
    label: "In Transit",
    color: "var(--chart-1)",
  },
  delivered: {
    label: "Delivered",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

const rangeLabels: Record<string, string> = {
  "90d": "Last 90 days",
  "30d": "Last 30 days",
  "7d": "Last 7 days",
}

export function FleetActivityAreaChart() {
  const [timeRange, setTimeRange] = React.useState("90d")

  const filteredData = React.useMemo(() => {
    let daysToSubtract = 90
    if (timeRange === "30d") daysToSubtract = 30
    if (timeRange === "7d") daysToSubtract = 7

    const referenceDate = new Date("2026-09-12")
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)

    return rawFleetData.filter((item) => new Date(item.date) >= startDate)
  }, [timeRange])

  return (
    <Card className="w-full flex flex-col justify-between h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
        <div className="grid gap-1">
          <CardTitle>Fleet Activity & Dispatch Volume</CardTitle>
          <CardDescription>
            Live trip progression and delivered freight orders over time
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[152px] h-9.5 text-xs font-semibold rounded-lg bg-[var(--surface-1)] border-[var(--border)] px-4 py-2">
              <SelectValue placeholder="Time range">
                {rangeLabels[timeRange] || timeRange}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="min-w-[164px]">
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-2 px-3 sm:px-5 pb-0 flex-1 flex flex-col justify-center">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[220px] w-full"
        >
          <AreaChart data={filteredData} margin={{ left: 10, right: 10, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="fillInTransit" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-inTransit)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-inTransit)"
                  stopOpacity={0.08}
                />
              </linearGradient>
              <linearGradient id="fillDelivered" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-delivered)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-delivered)"
                  stopOpacity={0.08}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={28}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--border-mid)", strokeWidth: 1 }}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    if (!value) return ""
                    return new Date(String(value)).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="inTransit"
              type="natural"
              fill="url(#fillInTransit)"
              stroke="var(--color-inTransit)"
              strokeWidth={2}
              stackId="fleet"
            />
            <Area
              dataKey="delivered"
              type="natural"
              fill="url(#fillDelivered)"
              stroke="var(--color-delivered)"
              strokeWidth={2}
              stackId="fleet"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="border-t border-[var(--border)] pt-3.5 pb-4 px-5">
        <div className="flex w-full items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-semibold text-[var(--text-mid)]">
              <span className="w-2 h-2 rounded-full bg-[var(--chart-3,#10B981)] inline-block" />
              <span>Delivered Orders</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-[var(--text-mid)]">
              <span className="w-2 h-2 rounded-full bg-[var(--chart-1,#0057FF)] inline-block" />
              <span>In Transit</span>
            </div>
          </div>
          <div className="text-[var(--text-low)] font-medium hidden sm:block">
            Updated live · Telemetry stream
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
