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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Wrench, AlertTriangle, CheckCircle, Clock, MapPin, Search, Calendar, Fuel, Settings } from "lucide-react";
import { PermissionGuard } from "@/components/site/PermissionGuard";

export const Route = createFileRoute("/_authenticated/admin/equipment")({
  head: () => ({ meta: [{ title: "Equipment — Operations" }] }),
  component: () => <PermissionGuard module="equipment"><EquipmentManagement /></PermissionGuard>,
});

const EQUIPMENT = [
  { id: "EQ001", name: "Tower Crane TC-48", category: "Crane", owned: true, status: "in_use", site: "Sector 62 Commercial", operator: "Mahesh Kumar", lastService: "2024-05-15", nextService: "2024-08-15", fuel: "Diesel", hours: 2840 },
  { id: "EQ002", name: "JCB 3DX Backhoe", category: "Earthmoving", owned: true, status: "in_use", site: "Township Phase 2", operator: "Vijay Rao", lastService: "2024-06-01", nextService: "2024-09-01", fuel: "Diesel", hours: 4120 },
  { id: "EQ003", name: "Concrete Mixer 10/7", category: "Mixer", owned: true, status: "available", site: "—", operator: "—", lastService: "2024-06-10", nextService: "2024-09-10", fuel: "Electric", hours: 1580 },
  { id: "EQ004", name: "Mobile Tower Light (x3)", category: "Lighting", owned: true, status: "in_use", site: "Green Valley Residences", operator: "Site Team", lastService: "2024-04-20", nextService: "2024-07-20", fuel: "Diesel", hours: 890 },
  { id: "EQ005", name: "Vibrator (Poker) Set", category: "Compaction", owned: true, status: "available", site: "—", operator: "—", lastService: "2024-06-05", nextService: "2024-09-05", fuel: "Electric", hours: 320 },
  { id: "EQ006", name: "Transit Mixer (8 Cum)", category: "Transport", owned: false, status: "rented", site: "Sector 62 Commercial", operator: "Vendor Driver", lastService: "2024-06-12", nextService: "2024-07-12", fuel: "Diesel", hours: 6200 },
  { id: "EQ007", name: "Scaffolding Set (500 SqM)", category: "Scaffolding", owned: true, status: "in_use", site: "Green Valley Residences", operator: "—", lastService: "2024-03-01", nextService: "2024-09-01", fuel: "—", hours: 0 },
  { id: "EQ008", name: "Plate Compactor", category: "Compaction", owned: true, status: "breakdown", site: "Township Phase 2", operator: "—", lastService: "2024-05-20", nextService: "2024-08-20", fuel: "Petrol", hours: 760 },
];

const MAINTENANCE = [
  { equipment: "Tower Crane TC-48", type: "Scheduled Service", date: "2024-08-15", status: "scheduled", cost: 35000, notes: "Quarterly lubrication and load test" },
  { equipment: "JCB 3DX Backhoe", type: "Oil Change", date: "2024-09-01", status: "scheduled", cost: 8500, notes: "500hr oil change + filter replacement" },
  { equipment: "Plate Compactor", type: "Breakdown Repair", date: "2024-06-19", status: "in_progress", cost: 12000, notes: "Engine starting issue — sent to workshop" },
  { equipment: "Mobile Tower Light", type: "Scheduled Service", date: "2024-07-20", status: "scheduled", cost: 4500, notes: "Monthly inspection and lamp check" },
  { equipment: "Transit Mixer", type: "Scheduled Service", date: "2024-07-12", status: "scheduled", cost: 6000, notes: "Vendor responsibility - follow up" },
];

const ALLOCATIONS = [
  { equipment: "Tower Crane TC-48", project: "Sector 62 Commercial", from: "2024-01-15", to: "2024-12-31", status: "active" },
  { equipment: "JCB 3DX Backhoe", project: "Township Phase 2", from: "2024-03-01", to: "2024-09-30", status: "active" },
  { equipment: "Transit Mixer (8 Cum)", project: "Sector 62 Commercial", from: "2024-06-01", to: "2024-07-31", status: "active" },
  { equipment: "Scaffolding Set", project: "Green Valley Residences", from: "2024-04-01", to: "2024-08-31", status: "active" },
  { equipment: "Concrete Mixer 10/7", project: "—", from: "—", to: "—", status: "available" },
];

const statusColor = (s: string) => {
  if (s === "in_use") return "bg-blue-100 text-blue-700 border-blue-200";
  if (s === "available") return "bg-green-100 text-green-700 border-green-200";
  if (s === "rented") return "bg-purple-100 text-purple-700 border-purple-200";
  if (s === "breakdown") return "bg-red-100 text-red-600 border-red-200";
  if (s === "maintenance") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-gray-100 text-gray-600";
};

function EquipmentManagement() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const available = EQUIPMENT.filter(e => e.status === "available").length;
  const inUse = EQUIPMENT.filter(e => e.status === "in_use").length;
  const breakdown = EQUIPMENT.filter(e => e.status === "breakdown").length;
  const rented = EQUIPMENT.filter(e => e.status === "rented").length;

  const filtered = EQUIPMENT.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Equipment Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Inventory, allocation, maintenance schedule, and service history</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={breakdownOpen} onOpenChange={setBreakdownOpen}>
            <DialogTrigger asChild><Button variant="outline" className="text-red-600 border-red-300"><AlertTriangle className="h-4 w-4 mr-2" />Report Breakdown</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Report Equipment Breakdown</DialogTitle></DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="space-y-1"><Label>Equipment</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select equipment" /></SelectTrigger>
                    <SelectContent>{EQUIPMENT.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Issue Description</Label><Textarea placeholder="Describe the breakdown issue..." rows={3} /></div>
                <div className="space-y-1"><Label>Location / Site</Label><Input placeholder="Sector 62 Commercial" /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBreakdownOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={() => { toast.error("Breakdown reported — maintenance team notified"); setBreakdownOpen(false); }}>Report</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Equipment</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Equipment</DialogTitle></DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Equipment Name</Label><Input placeholder="Tower Crane TC-48" /></div>
                  <div className="space-y-1"><Label>Category</Label><Input placeholder="Crane / Earthmoving / Mixer…" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Owned / Rented</Label>
                    <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent><SelectItem value="owned">Owned</SelectItem><SelectItem value="rented">Rented</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>Fuel Type</Label><Input placeholder="Diesel / Petrol / Electric" /></div>
                </div>
                <div className="space-y-1"><Label>Last Service Date</Label><Input type="date" /></div>
                <div className="space-y-1"><Label>Next Service Date</Label><Input type="date" /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => { toast.success("Equipment added"); setOpen(false); }}>Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Equipment", value: EQUIPMENT.length, color: "text-blue-600" },
          { label: "Available", value: available, color: "text-green-600" },
          { label: "In Use", value: inUse, color: "text-purple-600" },
          { label: "Breakdown", value: breakdown, color: "text-red-500" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {breakdown > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4 pb-4 flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-semibold">{EQUIPMENT.filter(e => e.status === "breakdown").map(e => e.name).join(", ")} — requires immediate attention</span>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search equipment..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="grid gap-3">
            {filtered.map(eq => (
              <Card key={eq.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{eq.name}</span>
                        <Badge variant="outline" className="text-xs">{eq.category}</Badge>
                        <Badge variant="outline" className="text-xs">{eq.owned ? "Owned" : "Rented"}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        {eq.site !== "—" && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{eq.site}</span>}
                        {eq.operator !== "—" && <span>Operator: {eq.operator}</span>}
                        <span className="flex items-center gap-1"><Fuel className="h-3 w-3" />{eq.fuel}</span>
                        <span>{eq.hours.toLocaleString()} hrs</span>
                        <span>Next Service: {eq.nextService}</span>
                      </div>
                    </div>
                    <Badge className={`${statusColor(eq.status)} text-xs`}>{eq.status.replace("_", " ")}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="allocation" className="mt-4">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{["Equipment","Project","From","To","Status"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ALLOCATIONS.map((a, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{a.equipment}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.project}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{a.from}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{a.to}</td>
                    <td className="px-4 py-3">
                      <Badge className={a.status === "active" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-green-100 text-green-700 border-green-200"}>{a.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4 space-y-3">
          {MAINTENANCE.map((m, i) => (
            <Card key={i} className={m.status === "in_progress" ? "border-amber-300" : ""}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{m.equipment}</span>
                      <Badge variant="outline" className="text-xs">{m.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{m.notes}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{m.date}</span>
                      <span>Cost: ₹{m.cost.toLocaleString()}</span>
                    </div>
                  </div>
                  <Badge className={m.status === "scheduled" ? "bg-blue-100 text-blue-700 border-blue-200" : m.status === "in_progress" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-green-100 text-green-700 border-green-200"}>
                    {m.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
