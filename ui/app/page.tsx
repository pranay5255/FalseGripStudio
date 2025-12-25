"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { 
  ClipboardCheck, 
  ShieldAlert, 
  MessageSquare, 
  SunMoon, 
  Trophy, 
  Utensils, 
  BrainCircuit, 
  Dumbbell, 
  Save,
  ArrowLeft,
  Plus
} from "lucide-react"
import { Client, ClientCard } from "@/components/client-card"
import { Sidebar } from "@/components/sidebar"

// Mock Data
const MOCK_CLIENTS: Client[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    status: "active",
    lastActive: "2 hours ago",
    program: "Weight Loss & Toning",
    avatar: "https://i.pravatar.cc/150?u=sarah",
    healthScore: 88,
    mealAdherence: 92,
    checkIns: 7,
    weightTrend: "down"
  },
  {
    id: "2",
    name: "Mike Chen",
    status: "active",
    lastActive: "5 mins ago",
    program: "Hypertrophy Basics",
    avatar: "https://i.pravatar.cc/150?u=mike",
    healthScore: 75,
    mealAdherence: 65,
    checkIns: 4,
    weightTrend: "up"
  },
  {
    id: "3",
    name: "Emma Davis",
    status: "pending",
    lastActive: "1 day ago",
    program: "Post-Injury Recovery",
    avatar: "https://i.pravatar.cc/150?u=emma",
    healthScore: 60,
    mealAdherence: 40,
    checkIns: 2,
    weightTrend: "stable"
  },
  {
    id: "4",
    name: "James Wilson",
    status: "inactive",
    lastActive: "2 weeks ago",
    program: "Marathon Prep",
    avatar: "https://i.pravatar.cc/150?u=james",
    healthScore: 45,
    mealAdherence: 20,
    checkIns: 0,
    weightTrend: "stable"
  }
]

export default function AgentDashboard() {
  const [activeView, setActiveView] = useState("clients")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [activeTab, setActiveTab] = useState("intake")

  const renderContent = () => {
    if (activeView === "billing") {
      return (
        <div className="max-w-4xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-bold text-slate-900">Billing & Plans</h1>
            <p className="text-slate-500">Manage your subscription and client billing</p>
          </header>
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>You are on the Professional Plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">Professional Plan</p>
                    <p className="text-sm text-slate-500">$99/month</p>
                  </div>
                  <Button variant="outline">Manage Subscription</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-slate-500">Active Clients</p>
                    <p className="text-2xl font-bold">12/20</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-slate-500">Next Billing Date</p>
                    <p className="text-2xl font-bold">Dec 1, 2025</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-slate-500">Est. Revenue</p>
                    <p className="text-2xl font-bold">$2,400</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (activeView === "support") {
      return (
        <div className="max-w-4xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-bold text-slate-900">Support</h1>
            <p className="text-slate-500">Get help with your dashboard</p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>Need help? Reach out to our team.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input placeholder="What do you need help with?" />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea placeholder="Describe your issue..." className="h-32" />
                </div>
                <Button className="w-full">Send Message</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Documentation</CardTitle>
                <CardDescription>Learn how to use the platform.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  Getting Started Guide
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Configuring AI Agents
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Managing Client Billing
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  API Documentation
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    // Client Management View
    if (!selectedClient) {
      return (
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Client Management</h1>
              <p className="text-slate-500">Manage client programs and AI configurations</p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Client
            </Button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_CLIENTS.map((client) => (
              <ClientCard 
                key={client.id} 
                client={client} 
                onSelect={setSelectedClient} 
              />
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedClient(null)}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{selectedClient.name}</h1>
              <p className="text-slate-500">Agent Configuration • {selectedClient.program}</p>
            </div>
          </div>
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </header>

        <Tabs
          orientation="vertical"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="md:col-span-1 h-fit">
              <CardContent className="p-4">
                <TabsList className="w-full flex flex-col gap-1 bg-transparent p-0">
                  <TabsTrigger
                    value="intake"
                    className="w-full justify-start gap-3 rounded-md px-3 py-2.5 text-left text-slate-600 hover:bg-slate-50 hover:text-slate-900 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    Intake & Onboarding
                  </TabsTrigger>
                  <TabsTrigger
                    value="safety"
                    className="w-full justify-start gap-3 rounded-md px-3 py-2.5 text-left text-slate-600 hover:bg-slate-50 hover:text-slate-900 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Safety Guardrails
                  </TabsTrigger>
                  <TabsTrigger
                    value="chat"
                    className="w-full justify-start gap-3 rounded-md px-3 py-2.5 text-left text-slate-600 hover:bg-slate-50 hover:text-slate-900 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Chat & Persona
                  </TabsTrigger>
                  <TabsTrigger
                    value="rituals"
                    className="w-full justify-start gap-3 rounded-md px-3 py-2.5 text-left text-slate-600 hover:bg-slate-50 hover:text-slate-900 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
                  >
                    <SunMoon className="h-4 w-4" />
                    Daily Rituals
                  </TabsTrigger>
                  <TabsTrigger
                    value="habits"
                    className="w-full justify-start gap-3 rounded-md px-3 py-2.5 text-left text-slate-600 hover:bg-slate-50 hover:text-slate-900 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
                  >
                    <Trophy className="h-4 w-4" />
                    Habits & Streaks
                  </TabsTrigger>
                  <TabsTrigger
                    value="nutrition"
                    className="w-full justify-start gap-3 rounded-md px-3 py-2.5 text-left text-slate-600 hover:bg-slate-50 hover:text-slate-900 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
                  >
                    <Utensils className="h-4 w-4" />
                    Nutrition
                  </TabsTrigger>
                  <TabsTrigger
                    value="training"
                    className="w-full justify-start gap-3 rounded-md px-3 py-2.5 text-left text-slate-600 hover:bg-slate-50 hover:text-slate-900 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
                  >
                    <Dumbbell className="h-4 w-4" />
                    Training & Form
                  </TabsTrigger>
                  <TabsTrigger
                    value="education"
                    className="w-full justify-start gap-3 rounded-md px-3 py-2.5 text-left text-slate-600 hover:bg-slate-50 hover:text-slate-900 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
                  >
                    <BrainCircuit className="h-4 w-4" />
                    Education & Science
                  </TabsTrigger>
                </TabsList>
              </CardContent>
            </Card>

            <div className="md:col-span-3">
              {/* 1. Deep Intake Interview */}
              <TabsContent value="intake" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Deep Intake Interview</CardTitle>
                    <CardDescription>Configure how the agent interviews new clients and gathers initial data.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="intake-enabled" className="flex flex-col space-y-1">
                        <span>Enable Intake Interview</span>
                        <span className="font-normal text-xs text-muted-foreground">Automatically start interview for new users</span>
                      </Label>
                      <Switch id="intake-enabled" defaultChecked />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Required Data Points</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch id="req-goals" defaultChecked />
                          <Label htmlFor="req-goals">Fitness Goals</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="req-injuries" defaultChecked />
                          <Label htmlFor="req-injuries">Injury History</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="req-history" defaultChecked />
                          <Label htmlFor="req-history">Training History</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="req-equip" defaultChecked />
                          <Label htmlFor="req-equip">Available Equipment</Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Custom Questions</Label>
                      <Textarea placeholder="Add specific questions you want the agent to ask every new client..." />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 2. Risk & Scope Guardrails */}
              <TabsContent value="safety" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Risk & Scope Guardrails</CardTitle>
                    <CardDescription>Set boundaries for when the agent should defer to medical professionals.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="strict-mode" className="flex flex-col space-y-1">
                        <span>Strict Medical Guardrails</span>
                        <span className="font-normal text-xs text-muted-foreground">Aggressively flag any medical keywords</span>
                      </Label>
                      <Switch id="strict-mode" defaultChecked />
                    </div>

                    <div className="space-y-2">
                      <Label>Red Flag Keywords</Label>
                      <Textarea defaultValue="chest pain, sharp pain, dizziness, fainting, broken bone, surgery, pregnant" />
                      <p className="text-xs text-muted-foreground">Comma separated list of terms that trigger the medical disclaimer.</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Medical Disclaimer Message</Label>
                      <Textarea defaultValue="I am an AI fitness assistant, not a doctor. Please consult with a healthcare professional regarding this symptom." />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 3. 24x7 Trainer Clone */}
              <TabsContent value="chat" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Trainer Clone Personality</CardTitle>
                    <CardDescription>Customize the voice and tone of your AI clone.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tone</Label>
                        <Input defaultValue="Encouraging but firm" />
                      </div>
                      <div className="space-y-2">
                        <Label>Communication Style</Label>
                        <Input defaultValue="Concise, uses emojis sparingly" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Fallback Templates</Label>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Equipment Unavailable</Label>
                          <Textarea className="h-20" defaultValue="No worries! Let's swap that for a bodyweight alternative. Try doing..." />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Missed Workout</Label>
                          <Textarea className="h-20" defaultValue="Life happens. Let's adjust the schedule. Can you do a shorter session tomorrow?" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 4. Morning & Evening Rituals */}
              <TabsContent value="rituals" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Rituals</CardTitle>
                    <CardDescription>Configure automated morning and evening check-ins.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Morning Check-in</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="pl-6 space-y-2">
                        <Label className="text-xs">Time</Label>
                        <Input type="time" defaultValue="07:00" className="w-32" />
                        <Label className="text-xs">Metrics to Track</Label>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <label className="flex items-center gap-2"><input type="checkbox" checked /> Sleep</label>
                          <label className="flex items-center gap-2"><input type="checkbox" checked /> Soreness</label>
                          <label className="flex items-center gap-2"><input type="checkbox" checked /> Mood</label>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Evening Recap</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="pl-6 space-y-2">
                        <Label className="text-xs">Time</Label>
                        <Input type="time" defaultValue="20:00" className="w-32" />
                        <Label className="text-xs">Reflection Questions</Label>
                        <Textarea defaultValue="What went well today? What was challenging?" className="h-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 5. Habit & Streak Mechanics */}
              <TabsContent value="habits" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Habits & Gamification</CardTitle>
                    <CardDescription>Set up tracking for daily habits and streak logic.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <Label>Active Trackers</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between border p-3 rounded-lg">
                          <Label>Step Count</Label>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between border p-3 rounded-lg">
                          <Label>Hydration</Label>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between border p-3 rounded-lg">
                          <Label>Protein Target</Label>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between border p-3 rounded-lg">
                          <Label>Sleep Hours</Label>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Nudge Frequency</Label>
                      <select className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm">
                        <option>Low (Only when critical)</option>
                        <option>Medium (Daily reminders)</option>
                        <option>High (Multiple times a day)</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 4.3 Nutrition & Calorie Estimation */}
              <TabsContent value="nutrition" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Nutrition & Analysis</CardTitle>
                    <CardDescription>Configure food recognition and dietary counseling.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="photo-logging" className="flex flex-col space-y-1">
                        <span>Photo Meal Logging</span>
                        <span className="font-normal text-xs text-muted-foreground">Allow clients to log meals by sending photos</span>
                      </Label>
                      <Switch id="photo-logging" defaultChecked />
                    </div>

                    <div className="space-y-2">
                      <Label>Tracking Philosophy</Label>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center space-x-2">
                          <input type="radio" name="philosophy" id="macro" className="accent-slate-900" defaultChecked />
                          <Label htmlFor="macro">Strict Macro Counting</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="radio" name="philosophy" id="hand" className="accent-slate-900" />
                          <Label htmlFor="hand">Hand Portions / Estimations</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="radio" name="philosophy" id="intuitive" className="accent-slate-900" />
                          <Label htmlFor="intuitive">Intuitive Eating / Adherence Only</Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Feedback Style</Label>
                      <Textarea defaultValue="Focus on protein intake first. Be gentle about occasional treats but firm on total daily calories." />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 4.4 Training & Form Feedback */}
              <TabsContent value="training" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Training & Form Analysis</CardTitle>
                    <CardDescription>Manage workout generation and video analysis settings.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <Label>Program Generation Style</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Split Preference</Label>
                          <Input defaultValue="Upper/Lower Split" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Progression Model</Label>
                          <Input defaultValue="Linear Progression + RPE" />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Video Form Analysis</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="pl-6 space-y-2">
                        <Label className="text-xs">Key Movements to Watch</Label>
                        <Textarea defaultValue="Squat depth, Neutral spine in deadlift, Elbow flare in bench press" />
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Injury Auto-Adjustment</Label>
                        <Switch defaultChecked />
                      </div>
                      <p className="text-xs text-muted-foreground">Automatically suggest regression exercises when pain is reported.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 4.5 Evidence-based & Education */}
              <TabsContent value="education" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Education & Science</CardTitle>
                    <CardDescription>Configure the knowledge base and educational content delivery.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="fact-check" className="flex flex-col space-y-1">
                        <span>Auto-Fact Checking</span>
                        <span className="font-normal text-xs text-muted-foreground">Debunk myths using trusted sources</span>
                      </Label>
                      <Switch id="fact-check" defaultChecked />
                    </div>

                    <div className="space-y-2">
                      <Label>Trusted Sources</Label>
                      <Textarea defaultValue="PubMed, Examine.com, ISSN Position Papers, Renaissance Periodization" />
                    </div>

                    <div className="space-y-2">
                      <Label>Educational Drip Campaign</Label>
                      <div className="border rounded-md p-4 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span>Week 1-2: Progressive Overload Basics</span>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>Week 3-4: Nutrition & Macros 101</span>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>Week 5+: Recovery & Sleep Hygiene</span>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeView={activeView} onViewChange={(view) => {
        setActiveView(view)
        setSelectedClient(null)
      }} />
      <main className="flex-1 ml-64 p-8">
        {renderContent()}
      </main>
    </div>
  )
}
