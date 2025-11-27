
import { 
  Users, 
  CreditCard, 
  LifeBuoy, 
  Settings,
  Dumbbell
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const menuItems = [
    { id: "clients", label: "Client Management", icon: Users },
    { id: "billing", label: "Billing & Plans", icon: CreditCard },
    { id: "support", label: "Support", icon: LifeBuoy },
  ]

  return (
    <div className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-primary/20 p-2 rounded-lg">
          <Dumbbell className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-lg">FalseGrip</h2>
          <p className="text-xs text-slate-400">Trainer Dashboard</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={activeView === item.id ? "secondary" : "ghost"}
            className={`w-full justify-start gap-3 ${
              activeView === item.id 
                ? "bg-slate-800 text-white hover:bg-slate-700" 
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            onClick={() => onViewChange(item.id)}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <Settings className="h-5 w-5" />
          Settings
        </Button>
      </div>
    </div>
  )
}
