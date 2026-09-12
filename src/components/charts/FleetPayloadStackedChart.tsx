"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const stackedData = [
  { month: "Jan", container: 186, dryBulk: 80, express: 45 },
  { month: "Feb", container: 205, dryBulk: 120, express: 62 },
  { month: "Mar", container: 237, dryBulk: 130, express: 78 },
  { month: "Apr", container: 273, dryBulk: 150, express: 95 },
  { month: "May", container: 309, dryBulk: 170, express: 110 },
  { month: "Jun", container: 344, dryBulk: 195, express: 130 },
]

const chartConfig = {
  container: {
    label: "Container Freight",
    color: "var(--chart-1)",
  },
  dryBulk: {
    label: "Dry Bulk & Raw Cargo",
    color: "var(--chart-2)",
  },
  express: {
    label: "Express & Parcel Courier",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

export function FleetPayloadStackedChart() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Freight Modality Breakdown (Stacked)</CardTitle>
        <CardDescription>
          Monthly tonnage distribution across primary freight categories
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 px-2 sm:px-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[240px] w-full">
          <AreaChart
            accessibilityLayer
            data={stackedData}
            margin={{ left: 12, right: 12, top: 8, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            <Area
              dataKey="express"
              type="natural"
              fill="var(--color-express)"
              fillOpacity={0.4}
              stroke="var(--color-express)"
              stackId="a"
            />
            <Area
              dataKey="dryBulk"
              type="natural"
              fill="var(--color-dryBulk)"
              fillOpacity={0.4}
              stroke="var(--color-dryBulk)"
              stackId="a"
            />
            <Area
              dataKey="container"
              type="natural"
              fill="var(--color-container)"
              fillOpacity={0.4}
              stroke="var(--color-container)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
