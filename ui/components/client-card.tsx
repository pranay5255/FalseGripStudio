
"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Clock, ArrowRight } from "lucide-react"

export type Client = {
  id: string
  name: string
  status: "active" | "inactive" | "pending"
  lastActive: string
  avatar?: string
  program: string
}

interface ClientCardProps {
  client: Client
  onSelect: (client: Client) => void
}

export function ClientCard({ client, onSelect }: ClientCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelect(client)}>
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar className="h-12 w-12">
          <AvatarImage src={client.avatar} alt={client.name} />
          <AvatarFallback>{client.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <CardTitle className="text-lg">{client.name}</CardTitle>
          <div className="flex gap-2 mt-1">
            <Badge variant={client.status === "active" ? "default" : "secondary"} className="text-xs">
              {client.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{client.program}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Last active {client.lastActive}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button variant="ghost" className="w-full justify-between" size="sm">
          Manage Configuration
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
