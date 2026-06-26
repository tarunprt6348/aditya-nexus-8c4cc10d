import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Calendar, Plus, Clock, Users, Wrench, Truck, CheckCircle, AlertTriangle } from "lucide-react";
import { PermissionGuard } from "@/components/site/PermissionGuard";

export const Route = createFileRoute("/_authenticated/admin/scheduling")({
  head: () => ({ meta: [{ title: "Scheduling — Operations" }] }),
  component: () => <PermissionGuard module="scheduling"><Scheduling /></PermissionGuard>,
});

const MILESTONES = [
  {
    project: "Sector 62 Commercial", totalProgress: 62,
    milestones: [
      { name: "Foundation & Sub-structure", due: "2024-02-28", status: "completed", pct: 100 },
      { name: "Ground – 3rd Floor Structure", due: "2024-04-30", status: "completed", pct: 100 },
      { name: "4th – 8th Floor Structure", due: "2024-07-31", status: "in_progress", pct: 75 },
      { name: "9th – 12th Floor Structure", due: "2024-10-31", status: "not_started", pct: 0 },
      { name: "MEP & Fit-out Works", due: "2024-12-15", status: "not_started", pct: 0 },
      { name: "Finishing & Handover", due: "2024-12-31", status: "not_started", pct: 0 },
    ]
  },
  {
    project: "Green Valley Residences", totalProgress: 48,
    milestones: [
      { name: "Foundation & Plinth", due: "2023-11-30", status: "completed", pct: 100 },
      { name: "Ground + 3 Floors RCC", due: "2024-03-31", status: "completed", pct: 100 },
      { name: "Brick Work & Plastering", due: "2024-07-31", status: "in_progress", pct: 65 },
      { name: "Flooring & Tiling", due: "2024-09-30", status: "not_started", pct: 0 },
      { name: "Finishing & Handover", due: "2024-10-31", status: "not_started", pct: 0 },
    ]
  },
];

const EMPLOYEE_SCHEDULE = [
  { employee: "Rohit Agarwal", role: "Site Engineer", assignments: ["Sector 62 – Mon to Sat", "Patel Residence – Sunday"], leave: "—" },
  { employee: "Amit Singh", role: "Site Engineer", assignments: ["Green Valley – Mon to Sat"], leave: "June 22-23 (approved)" },
  { employee: "Sanjay Tiwari", role: "Project Manager", assignments: ["Township Phase 2 – Mon to Fri", "Green Valley – Sat"], leave: "—" },
  { employee: "Priya Gupta", role: "Project Manager", assignments: ["Sector 62 – Mon to Thu", "Client meetings – Fri"], leave: "—" },
  { employee: "Deepak Joshi", role: "Sales Manager", assignments: ["Office – Mon to Fri", "Site visits – as needed"], leave: "June 25 (approved)" },
];

const EQUIPMENT_BOOKINGS = [
  { equipment: "Tower Crane TC-48", bookedFor: "Sector 62 Commercial", from: "2024-06-18", to: "2024-06-25", bookedBy: "Rohit Agarwal", status: "confirmed" },
  { equipment: "JCB 3DX", bookedFor: "Township Phase 2", from: "2024-06-18", to: "2024-06-22", bookedBy: "Sanjay Tiwari", status: "confirmed" },
  { equipment: "Concrete Mixer 10/7", bookedFor: "Patel Residence", from: "2024-06-20", to: "2024-06-21", bookedBy: "Rohit Agarwal", status: "pending" },
  { equipment: "Mobile Tower Light", bookedFor: "Sector 62 – Night work", from: "2024-06-19", to: "2024-06-21", bookedBy: "Rohit Agarwal", status: "confirmed" },
];

const DELIVERIES_SCHEDULE = [
  { material: "OPC Cement 200 bags", supplier: "Buildex Materials", project: "Sector 62", scheduledDate: "2024-06-20", status: "confirmed" },
  { material: "AAC Blocks 2000 nos", supplier: "AACBlox India", project: "Green Valley", scheduledDate: "2024-06-22", status: "in_transit" },
  { material: "Ceramic Tiles 1500 Sqft", supplier: "Somany Tiles", project: "Patel Residence", scheduledDate: "2024-06-28", status: "pending" },
  { material: "M30 Ready Mix Concrete 150 CUM", supplier: "ConcreteX", project: "Sector 62", scheduledDate: "2024-06-24", status: "pending" },
];

const MEETINGS = [
  { title: "Weekly Project Review", date: "2024-06-21", time: "10:00 AM", attendees: "PM, Site Engineers, Operations Manager", location: "HO Conference Room", type: "internal" },
  { title: "Client Meeting – Metro Infra", date: "2024-06-22", time: "3:00 PM", attendees: "Operations Manager, Priya Gupta", location: "Client Office", type: "client" },
  { title: "Safety Committee Meeting", date: "2024-06-25", time: "11:00 AM", attendees: "All Site Managers", location: "Sector 62 Site Office", type: "safety" },
  { title: "Vendor Payment Review", date: "2024-06-28", time: "2:00 PM", attendees: "Accountant, Operations Manager", location: "HO", type: "internal" },
];

function Scheduling() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Scheduling</h1>
          <p className="text-sm text-muted-foreground mt-1">Project milestones, employee schedules, equipment bookings, and delivery calendar</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Event</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Schedule Event / Booking</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="space-y-1"><Label>Event Type</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="equipment">Equipment Booking</SelectItem>
                    <SelectItem value="delivery">Material Delivery</SelectItem>
                    <SelectItem value="inspection">Site Inspection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Title / Description</Label><Input placeholder="Weekly project review..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Date</Label><Input type="date" /></div>
                <div className="space-y-1"><Label>Time</Label><Input type="time" /></div>
              </div>
              <div className="space-y-1"><Label>Project / Location</Label><Input placeholder="Sector 62 Commercial" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => { toast.success("Event scheduled"); setOpen(false); }}>Schedule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="milestones">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="milestones">Project Milestones</TabsTrigger>
          <TabsTrigger value="employees">Employee Schedule</TabsTrigger>
          <TabsTrigger value="equipment">Equipment Bookings</TabsTrigger>
          <TabsTrigger value="deliveries">Delivery Schedule</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
        </TabsList>

        <TabsContent value="milestones" className="mt-4 space-y-6">
          {MILESTONES.map((proj, pi) => (
            <Card key={pi}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{proj.project}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Overall Progress</span>
                    <span className="font-bold text-sm">{proj.totalProgress}%</span>
                  </div>
                </div>
                <Progress value={proj.totalProgress} className="h-2 mt-1" />
              </CardHeader>
              <CardContent className="space-y-2">
                {proj.milestones.map((m, mi) => (
                  <div key={mi} className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${m.status === "completed" ? "bg-green-500" : m.status === "in_progress" ? "bg-blue-500" : "bg-gray-300"}`} />
                    <span className={`text-sm flex-1 ${m.status === "completed" ? "text-muted-foreground line-through" : ""}`}>{m.name}</span>
                    <span className="text-xs text-muted-foreground">{m.due}</span>
                    <Badge className={m.status === "completed" ? "bg-green-100 text-green-700 border-green-200 text-xs" : m.status === "in_progress" ? "bg-blue-100 text-blue-700 border-blue-200 text-xs" : "bg-gray-100 text-gray-500 text-xs"}>
                      {m.status.replace("_"," ")}
                    </Badge>
                    <span className="text-xs font-semibold w-8 text-right">{m.pct}%</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="employees" className="mt-4">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{["Employee","Role","Current Assignments","Leave Scheduled"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {EMPLOYEE_SCHEDULE.map((e, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{e.employee}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{e.role}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {e.assignments.map((a, j) => <p key={j} className="text-xs text-muted-foreground">• {a}</p>)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{e.leave === "—" ? <span className="text-green-600">No leave</span> : <span className="text-amber-600">{e.leave}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="equipment" className="mt-4">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{["Equipment","Project","From","To","Booked By","Status"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {EQUIPMENT_BOOKINGS.map((b, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{b.equipment}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.bookedFor}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{b.from}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{b.to}</td>
                    <td className="px-4 py-3 text-xs">{b.bookedBy}</td>
                    <td className="px-4 py-3">
                      <Badge className={b.status === "confirmed" ? "bg-green-100 text-green-700 border-green-200" : "bg-amber-100 text-amber-700 border-amber-200"}>
                        {b.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="deliveries" className="mt-4">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{["Material","Supplier","Project","Scheduled Date","Status"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {DELIVERIES_SCHEDULE.map((d, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{d.material}</td>
                    <td className="px-4 py-3 text-muted-foreground text-sm">{d.supplier}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{d.project}</td>
                    <td className="px-4 py-3 text-xs">{d.scheduledDate}</td>
                    <td className="px-4 py-3">
                      <Badge className={d.status === "confirmed" ? "bg-green-100 text-green-700 border-green-200" : d.status === "in_transit" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-amber-100 text-amber-700 border-amber-200"}>
                        {d.status.replace("_"," ")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="meetings" className="mt-4 space-y-3">
          {MEETINGS.map((m, i) => (
            <Card key={i}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2 shrink-0 ${m.type === "client" ? "bg-blue-100" : m.type === "safety" ? "bg-red-100" : "bg-purple-100"}`}>
                    <Calendar className={`h-4 w-4 ${m.type === "client" ? "text-blue-600" : m.type === "safety" ? "text-red-600" : "text-purple-600"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{m.title}</span>
                      <Badge variant="outline" className="text-xs capitalize">{m.type}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{m.date} · {m.time}</span>
                      <span>{m.location}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{m.attendees}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
