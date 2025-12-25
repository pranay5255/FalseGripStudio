
"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Clock, ArrowRight, TrendingUp, TrendingDown, Minus, CheckCircle2, Utensils } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

export type Client = {
  id: string
  name: string
  status: "active" | "inactive" | "pending"
  lastActive: string
  avatar?: string
  program: string
  healthScore: number // 0-100
  mealAdherence: number // percentage
  checkIns: number // count this week
  weightTrend: "up" | "down" | "stable"
}

interface ClientCardProps {
  client: Client
  onSelect: (client: Client) => void
}

export function ClientCard({ client, onSelect }: ClientCardProps) {
  const data = [
    { name: 'Health', value: client.healthScore },
    { name: 'Remaining', value: 100 - client.healthScore },
  ];

  const COLORS = ['#10b981', '#e2e8f0']; // emerald-500 for health, slate-200 for remaining

  return (
    <Card
      className="flex h-full flex-col cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
      onClick={() => onSelect(client)}
    >
      <CardHeader className="relative flex flex-row items-center gap-4 pb-3 pr-20">
        <div className="absolute top-4 right-4 h-16 w-16">
           <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={20}
                outerRadius={30}
                startAngle={90}
                endAngle={-270}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">
            {client.healthScore}%
          </div>
        </div>

        <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
          <AvatarImage src={client.avatar} alt={client.name} />
          <AvatarFallback>{client.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <CardTitle className="text-lg leading-tight">{client.name}</CardTitle>
          <div className="flex gap-2 mt-1">
            <Badge variant={client.status === "active" ? "default" : "secondary"} className="text-xs px-2 py-0 h-5">
              {client.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-4 pt-2">
        <div className="grid grid-cols-3 gap-2 text-xs mb-4">
            <div className="bg-slate-50 p-2 rounded-md flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1 text-slate-500 mb-1">
                    <Utensils className="h-3 w-3" />
                    <span>Meals</span>
                </div>
                <span className="font-semibold text-slate-900">{client.mealAdherence}%</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-md flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1 text-slate-500 mb-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Check-ins</span>
                </div>
                <span className="font-semibold text-slate-900">{client.checkIns}/7</span>
            </div>
             <div className="bg-slate-50 p-2 rounded-md flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1 text-slate-500 mb-1">
                    {client.weightTrend === 'up' && <TrendingUp className="h-3 w-3 text-red-500" />}
                    {client.weightTrend === 'down' && <TrendingDown className="h-3 w-3 text-green-500" />}
                    {client.weightTrend === 'stable' && <Minus className="h-3 w-3 text-slate-400" />}
                    <span>Weight</span>
                </div>
                <span className="font-semibold text-slate-900 capitalize">{client.weightTrend}</span>
            </div>
        </div>

        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            <span className="truncate">{client.program}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            <span>Last active {client.lastActive}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-6 pb-4 pt-0">
        <Button variant="ghost" className="w-full justify-between h-8 text-xs hover:bg-slate-100" size="sm">
          Manage Configuration
          <ArrowRight className="h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  )
}
