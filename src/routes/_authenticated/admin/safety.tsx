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
import { HardHat, AlertTriangle, CheckCircle, Plus, Shield, Users, BookOpen, Phone, Siren } from "lucide-react";
import { PermissionGuard } from "@/components/site/PermissionGuard";

export const Route = createFileRoute("/_authenticated/admin/safety")({
  head: () => ({ meta: [{ title: "Safety Management — Operations" }] }),
  component: () => <PermissionGuard module="safety"><SafetyManagement /></PermissionGuard>,
});

const INSPECTIONS = [
  { id: "SI001", project: "Sector 62 Commercial", date: "2024-06-18", inspector: "Operations Manager", score: 88, issues: 2, status: "completed" },
  { id: "SI002", project: "Green Valley Residences", date: "2024-06-17", inspector: "Amit Singh", score: 94, issues: 1, status: "completed" },
  { id: "SI003", project: "Township Phase 2", date: "2024-06-16", inspector: "Operations Manager", score: 78, issues: 4, status: "completed" },
  { id: "SI004", project: "Patel Residence", date: "2024-06-14", inspector: "Rohit Agarwal", score: 96, issues: 0, status: "completed" },
];

const PPE_TRACKER = [
  { item: "Safety Helmets", total: 120, issued: 95, available: 25, condition: "Good", reorderDate: "2024-09-01" },
  { item: "Safety Harnesses", total: 40, issued: 32, available: 8, condition: "Good", reorderDate: "2024-08-15" },
  { item: "Safety Shoes", total: 100, issued: 78, available: 22, condition: "Good", reorderDate: "2024-10-01" },
  { item: "Fluorescent Vests", total: 150, issued: 112, available: 38, condition: "Good", reorderDate: "2024-09-15" },
  { item: "Safety Goggles", total: 60, issued: 48, available: 12, condition: "Moderate", reorderDate: "2024-07-01" },
  { item: "Work Gloves (pairs)", total: 200, issued: 165, available: 35, condition: "Low Stock", reorderDate: "2024-06-30" },
  { item: "Ear Muffs", total: 30, issued: 22, available: 8, condition: "Good", reorderDate: "2024-11-01" },
  { item: "Dust Masks (N95)", total: 500, issued: 420, available: 80, condition: "Good", reorderDate: "2024-07-15" },
];

const TRAINING = [
  { id: "TR001", topic: "Working at Heights", participants: 28, date: "2024-06-01", trainer: "External Safety Consultant", status: "completed", validity: "2025-06-01" },
  { id: "TR002", topic: "Fire Safety & Evacuation", participants: 65, date: "2024-05-15", trainer: "Fire Dept. Officer", status: "completed", validity: "2025-05-15" },
  { id: "TR003", topic: "First Aid & CPR", participants: 20, date: "2024-04-10", trainer: "Red Cross Certified", status: "completed", validity: "2026-04-10" },
  { id: "TR004", topic: "Electrical Safety", participants: 18, date: "2024-07-10", trainer: "EHS Manager", status: "scheduled", validity: "—" },
  { id: "TR005", topic: "Equipment Operation Safety", participants: 12, date: "2024-07-20", trainer: "OEM Trainer", status: "scheduled", validity: "—" },
];

const HAZARDS = [
  { id: "HAZ001", project: "Sector 62 Commercial", hazard: "Edge protection missing on 8th floor perimeter", risk: "high", reportedBy: "Rohit Agarwal", date: "2024-06-18", status: "action_taken" },
  { id: "HAZ002", project: "Township Phase 2", hazard: "Open excavation pit without barricading", risk: "high", reportedBy: "Sanjay Tiwari", date: "2024-06-16", status: "pending" },
  { id: "HAZ003", project: "Green Valley Residences", hazard: "Improper material storage — pathway blocked", risk: "medium", reportedBy: "Amit Singh", date: "2024-06-15", status: "resolved" },
  { id: "HAZ004", project: "Sector 62 Commercial", hazard: "Worn lifting slings on material hoist", risk: "high", reportedBy: "Rohit Agarwal", date: "2024-06-14", status: "resolved" },
];

const EMERGENCY = [
  { name: "Nearest Hospital", detail: "Yatharth Hospital, Greater Noida", phone: "0120-4555000", type: "hospital" },
  { name: "Fire Station", detail: "Greater Noida Fire Station", phone: "101", type: "emergency" },
  { name: "Police Station", detail: "Beta 2 Police Station", phone: "0120-2325010", type: "emergency" },
  { name: "Site Safety Officer", detail: "Operations Manager", phone: "+91-9000000002", type: "staff" },
  { name: "Company Emergency", detail: "Aditya Constructions HO", phone: "+91-9000000001", type: "staff" },
  { name: "Ambulance", detail: "108 Emergency Service", phone: "108", type: "emergency" },
];

function SafetyManagement() {
  const [open, setOpen] = useState(false);
  const avgScore = Math.round(INSPECTIONS.reduce((s, i) => s + i.score, 0) / INSPECTIONS.length);
  const openHazards = HAZARDS.filter(h => h.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Safety Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Inspections, incidents, PPE, training records, hazards, and emergency contacts</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Report Hazard</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Report Safety Hazard</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="space-y-1"><Label>Project</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="s62">Sector 62 Commercial</SelectItem>
                    <SelectItem value="gv">Green Valley Residences</SelectItem>
                    <SelectItem value="tp2">Township Phase 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Hazard Description</Label><Textarea placeholder="Describe the hazard clearly..." rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Risk Level</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select risk" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Location</Label><Input placeholder="8th Floor – East side" /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => { toast.success("Hazard reported — safety team notified"); setOpen(false); }}>Report</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Avg Safety Score", value: `${avgScore}%`, icon: Shield, color: "text-green-600" },
          { label: "Inspections (June)", value: INSPECTIONS.length, icon: CheckCircle, color: "text-blue-600" },
          { label: "Open Hazards", value: openHazards, icon: AlertTriangle, color: "text-red-500" },
          { label: "Training Scheduled", value: TRAINING.filter(t => t.status === "scheduled").length, icon: BookOpen, color: "text-purple-600" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-2xl font-bold mt-1">{s.value}</p></div>
                <s.icon className={`h-8 w-8 ${s.color} opacity-20`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="inspections">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="ppe">PPE Tracking</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="hazards">Hazards</TabsTrigger>
          <TabsTrigger value="emergency">Emergency Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="inspections" className="mt-4 space-y-3">
          {INSPECTIONS.map(ins => (
            <Card key={ins.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold">{ins.project}</p>
                    <p className="text-xs text-muted-foreground">{ins.date} · Inspector: {ins.inspector}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${ins.score >= 90 ? "text-green-600" : ins.score >= 80 ? "text-amber-600" : "text-red-600"}`}>{ins.score}%</p>
                    <p className="text-xs text-muted-foreground">{ins.issues} issue(s)</p>
                  </div>
                </div>
                <Progress value={ins.score} className={`h-2 ${ins.score >= 90 ? "[&>div]:bg-green-500" : ins.score >= 80 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"}`} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="ppe" className="mt-4">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{["PPE Item","Total","Issued","Available","Condition","Reorder Date"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {PPE_TRACKER.map((p, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium flex items-center gap-2"><HardHat className="h-4 w-4 text-amber-500" />{p.item}</td>
                    <td className="px-4 py-3 text-center">{p.total}</td>
                    <td className="px-4 py-3 text-center text-blue-600 font-semibold">{p.issued}</td>
                    <td className="px-4 py-3 text-center text-green-600 font-semibold">{p.available}</td>
                    <td className="px-4 py-3">
                      <Badge className={p.condition === "Good" ? "bg-green-100 text-green-700 border-green-200" : p.condition === "Low Stock" ? "bg-red-100 text-red-600 border-red-200" : "bg-amber-100 text-amber-700 border-amber-200"} variant="outline">{p.condition}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{p.reorderDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="training" className="mt-4 space-y-3">
          {TRAINING.map(t => (
            <Card key={t.id} className={t.status === "scheduled" ? "border-blue-200 bg-blue-50/30" : ""}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-full p-2 mt-0.5 ${t.status === "completed" ? "bg-green-100" : "bg-blue-100"}`}>
                      <BookOpen className={`h-4 w-4 ${t.status === "completed" ? "text-green-600" : "text-blue-600"}`} />
                    </div>
                    <div>
                      <p className="font-semibold">{t.topic}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span>{t.date}</span>
                        <span>{t.participants} participants</span>
                        <span>Trainer: {t.trainer}</span>
                        {t.validity !== "—" && <span>Valid till: {t.validity}</span>}
                      </div>
                    </div>
                  </div>
                  <Badge className={t.status === "completed" ? "bg-green-100 text-green-700 border-green-200" : "bg-blue-100 text-blue-700 border-blue-200"}>
                    {t.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="hazards" className="mt-4 space-y-3">
          {HAZARDS.map(h => (
            <Card key={h.id} className={h.risk === "high" && h.status === "pending" ? "border-red-300 bg-red-50" : ""}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${h.risk === "high" ? "text-red-500" : "text-amber-500"}`} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{h.hazard}</span>
                        <Badge className={h.risk === "high" ? "bg-red-100 text-red-600 border-red-200" : "bg-amber-100 text-amber-700 border-amber-200"} variant="outline">{h.risk} risk</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{h.project} · {h.date} · Reported by {h.reportedBy}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={h.status === "resolved" ? "bg-green-100 text-green-700 border-green-200" : h.status === "action_taken" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-red-100 text-red-600 border-red-200"}>
                      {h.status.replace("_"," ")}
                    </Badge>
                    {h.status === "pending" && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.success("Action marked taken")}>Act Now</Button>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="emergency" className="mt-4">
          <div className="grid md:grid-cols-2 gap-3">
            {EMERGENCY.map((e, i) => (
              <Card key={i} className={e.type === "emergency" ? "border-red-200" : ""}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2.5 ${e.type === "emergency" ? "bg-red-100" : e.type === "hospital" ? "bg-blue-100" : "bg-green-100"}`}>
                      {e.type === "emergency" ? <Siren className="h-4 w-4 text-red-600" /> : e.type === "hospital" ? <Shield className="h-4 w-4 text-blue-600" /> : <Phone className="h-4 w-4 text-green-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{e.name}</p>
                      <p className="text-xs text-muted-foreground">{e.detail}</p>
                    </div>
                    <a href={`tel:${e.phone}`} className="text-sm font-mono font-bold text-blue-600 hover:underline">{e.phone}</a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
