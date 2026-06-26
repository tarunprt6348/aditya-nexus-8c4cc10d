import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Camera, Plus, AlertTriangle, Cloud, CheckCircle, Clock, MapPin, FileText, Upload, TrendingUp } from "lucide-react";
import { PermissionGuard } from "@/components/site/PermissionGuard";

export const Route = createFileRoute("/_authenticated/admin/site-monitoring")({
  head: () => ({ meta: [{ title: "Site Monitoring — Operations" }] }),
  component: () => <PermissionGuard module="site_monitoring"><SiteMonitoring /></PermissionGuard>,
});

const DAILY_REPORTS = [
  {
    id: "SR001", project: "Sector 62 Commercial", date: "2024-06-18", reportedBy: "Rohit Agarwal",
    weather: "Sunny, 38°C", workforce: 48, progress: "Column casting completed on 8th floor, shuttering ongoing for 9th floor",
    materialsUsed: "Cement 80 bags, Steel 2.5 MT", issues: "Minor delay due to rebar delivery", status: "submitted"
  },
  {
    id: "SR002", project: "Green Valley Residences", date: "2024-06-18", reportedBy: "Amit Singh",
    weather: "Partly Cloudy, 35°C", workforce: 32, progress: "Block A plastering 70% complete. Block B slab casting scheduled for tomorrow",
    materialsUsed: "Sand 150 CFT, Cement 45 bags", issues: "None", status: "submitted"
  },
  {
    id: "SR003", project: "Township Phase 2", date: "2024-06-18", reportedBy: "Sanjay Tiwari",
    weather: "Sunny, 37°C", workforce: 65, progress: "Foundation excavation Phase 2B complete. PCC casting started",
    materialsUsed: "Cement 120 bags, Aggregates 400 CFT", issues: "Heavy vehicle route needs repair", status: "submitted"
  },
  {
    id: "SR004", project: "Patel Residence", date: "2024-06-17", reportedBy: "Rohit Agarwal",
    weather: "Hot, 39°C", workforce: 12, progress: "1st floor brick work 85% complete. Electrical conduit laying in progress",
    materialsUsed: "AAC Blocks 200 nos, PVC pipes 50 rmt", issues: "Electrical material delivery pending", status: "submitted"
  },
];

const INCIDENTS = [
  { id: "INC001", project: "Sector 62 Commercial", date: "2024-06-15", type: "Near Miss", description: "Worker nearly fell from scaffold — safety harness not worn. Corrective action taken.", severity: "medium", reportedBy: "Rohit Agarwal", status: "resolved" },
  { id: "INC002", project: "Township Phase 2", date: "2024-06-10", type: "Property Damage", description: "Minor damage to formwork during concrete pour due to excessive vibration.", severity: "low", reportedBy: "Sanjay Tiwari", status: "resolved" },
  { id: "INC003", project: "Green Valley Residences", date: "2024-06-08", type: "Minor Injury", description: "Worker sustained minor hand cut. First aid administered, returned to work same day.", severity: "low", reportedBy: "Amit Singh", status: "closed" },
];

const WEATHER = [
  { day: "Today", condition: "Sunny", temp: "38°C / 28°C", wind: "12 km/h", humidity: "42%", suitable: true },
  { day: "Tomorrow", condition: "Partly Cloudy", temp: "36°C / 27°C", wind: "15 km/h", humidity: "48%", suitable: true },
  { day: "Jun 20", condition: "Chance of Rain", temp: "32°C / 24°C", wind: "22 km/h", humidity: "68%", suitable: true },
  { day: "Jun 21", condition: "Thunderstorm", temp: "30°C / 22°C", wind: "35 km/h", humidity: "85%", suitable: false },
  { day: "Jun 22", condition: "Cloudy", temp: "31°C / 23°C", wind: "18 km/h", humidity: "72%", suitable: true },
];

const RESOURCE_UTIL = [
  { project: "Sector 62 Commercial", manpowerPct: 80, equipmentPct: 90, materialPct: 65 },
  { project: "Green Valley Residences", manpowerPct: 65, equipmentPct: 55, materialPct: 72 },
  { project: "Township Phase 2", manpowerPct: 88, equipmentPct: 75, materialPct: 80 },
  { project: "Patel Residence", manpowerPct: 40, equipmentPct: 30, materialPct: 55 },
];

function SiteMonitoring() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Site Monitoring</h1>
          <p className="text-sm text-muted-foreground mt-1">Daily reports, progress updates, incidents, weather, and resource utilization</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Submit Daily Report</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Daily Site Report</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Project</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="s62">Sector 62 Commercial</SelectItem>
                      <SelectItem value="gv">Green Valley Residences</SelectItem>
                      <SelectItem value="tp2">Township Phase 2</SelectItem>
                      <SelectItem value="pr">Patel Residence</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Date</Label><Input type="date" defaultValue={new Date().toISOString().split("T")[0]} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Weather Conditions</Label><Input placeholder="Sunny, 38°C" /></div>
                <div className="space-y-1"><Label>Workforce Present</Label><Input type="number" placeholder="45" /></div>
              </div>
              <div className="space-y-1"><Label>Work Progress</Label><Textarea placeholder="Describe today's activities..." rows={3} /></div>
              <div className="space-y-1"><Label>Materials Used</Label><Input placeholder="Cement 60 bags, Steel 2 MT..." /></div>
              <div className="space-y-1"><Label>Issues / Delays</Label><Input placeholder="Any issues encountered..." /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => { toast.success("Daily report submitted"); setOpen(false); }}>Submit Report</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Sites", value: 4, icon: MapPin, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Reports Today", value: 3, icon: FileText, color: "text-green-600", bg: "bg-green-50" },
          { label: "Open Incidents", value: INCIDENTS.filter(i => i.status !== "closed" && i.status !== "resolved").length, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Total Workforce", value: DAILY_REPORTS.reduce((s, r) => s + r.workforce, 0), icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-2xl font-bold mt-1">{s.value}</p></div>
                <div className={`rounded-lg p-2 ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports">Daily Reports</TabsTrigger>
          <TabsTrigger value="incidents">Incident Reports</TabsTrigger>
          <TabsTrigger value="weather">Weather</TabsTrigger>
          <TabsTrigger value="resources">Resource Utilization</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="mt-4 space-y-4">
          {DAILY_REPORTS.map(r => (
            <Card key={r.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{r.project}</span>
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">{r.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{r.date}</span>
                      <span>By: {r.reportedBy}</span>
                      <span className="flex items-center gap-1"><Cloud className="h-3 w-3" />{r.weather}</span>
                      <span>Workforce: {r.workforce}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm"><FileText className="h-4 w-4" /></Button>
                </div>
                <div className="grid md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">PROGRESS</p>
                    <p className="text-sm">{r.progress}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">MATERIALS USED</p>
                    <p className="text-sm">{r.materialsUsed}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">ISSUES</p>
                    <p className="text-sm">{r.issues === "None" ? <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-3.5 w-3.5" />No issues</span> : r.issues}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="incidents" className="mt-4 space-y-3">
          {INCIDENTS.map(inc => (
            <Card key={inc.id} className={inc.severity === "medium" ? "border-amber-300" : ""}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-full p-1.5 mt-0.5 ${inc.severity === "medium" ? "bg-amber-100" : "bg-blue-100"}`}>
                      <AlertTriangle className={`h-3.5 w-3.5 ${inc.severity === "medium" ? "text-amber-600" : "text-blue-600"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{inc.type}</span>
                        <Badge variant="outline" className="text-xs">{inc.project}</Badge>
                        <Badge className={inc.severity === "high" ? "bg-red-100 text-red-700 border-red-200" : inc.severity === "medium" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-blue-100 text-blue-700 border-blue-200"} variant="outline">{inc.severity}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{inc.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{inc.date} · Reported by {inc.reportedBy}</p>
                    </div>
                  </div>
                  <Badge className={inc.status === "closed" ? "bg-green-100 text-green-700 border-green-200" : inc.status === "resolved" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-amber-100 text-amber-700 border-amber-200"}>
                    {inc.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="weather" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {WEATHER.map((w, i) => (
              <Card key={i} className={!w.suitable ? "border-red-200 bg-red-50" : i === 0 ? "border-blue-200 bg-blue-50" : ""}>
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-xs font-semibold text-muted-foreground">{w.day}</p>
                  <div className="my-3 text-3xl">{w.condition.includes("Rain") || w.condition.includes("Storm") ? "🌧️" : w.condition.includes("Cloudy") ? "⛅" : "☀️"}</div>
                  <p className="text-sm font-semibold">{w.temp}</p>
                  <p className="text-xs text-muted-foreground">{w.wind} · {w.humidity}</p>
                  <Badge className={`mt-2 text-xs ${w.suitable ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-600 border-red-200"}`}>
                    {w.suitable ? "✓ Suitable" : "✗ Halt Work"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            <Cloud className="h-3.5 w-3.5" />
            Weather data for Greater Noida, Uttar Pradesh. Work halt advisory issued for days with thunderstorm forecast.
          </p>
        </TabsContent>

        <TabsContent value="resources" className="mt-4 space-y-4">
          {RESOURCE_UTIL.map((r, i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{r.project}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Manpower", value: r.manpowerPct },
                  { label: "Equipment", value: r.equipmentPct },
                  { label: "Materials", value: r.materialPct },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-20">{item.label}</span>
                    <Progress value={item.value} className={`flex-1 h-2 ${item.value > 85 ? "[&>div]:bg-amber-500" : "[&>div]:bg-blue-500"}`} />
                    <span className="text-xs font-semibold w-8 text-right">{item.value}%</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
