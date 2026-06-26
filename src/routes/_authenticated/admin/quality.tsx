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
import { CheckSquare, Plus, AlertTriangle, CheckCircle, XCircle, ClipboardList, FlaskConical, ShieldCheck } from "lucide-react";
import { PermissionGuard } from "@/components/site/PermissionGuard";

export const Route = createFileRoute("/_authenticated/admin/quality")({
  head: () => ({ meta: [{ title: "Quality Control — Operations" }] }),
  component: () => <PermissionGuard module="quality"><QualityControl /></PermissionGuard>,
});

const CHECKLISTS = [
  {
    id: "QC001", project: "Sector 62 Commercial", activity: "Column Casting – 8th Floor", date: "2024-06-17", inspector: "Rohit Agarwal",
    items: [
      { item: "Rebar spacing as per drawing", status: "pass" },
      { item: "Cover block placement", status: "pass" },
      { item: "Formwork alignment & plumb", status: "pass" },
      { item: "Concrete mix design M30", status: "pass" },
      { item: "Slump test within range (75±25mm)", status: "fail" },
      { item: "Curing arrangement in place", status: "pass" },
    ],
    overallStatus: "fail"
  },
  {
    id: "QC002", project: "Green Valley Residences", activity: "Plastering – Block A", date: "2024-06-16", inspector: "Amit Singh",
    items: [
      { item: "Surface preparation (hacking) done", status: "pass" },
      { item: "Waterproofing agent mixed", status: "pass" },
      { item: "12mm thickness maintained", status: "pass" },
      { item: "No cracks visible", status: "pass" },
      { item: "Curing commenced within 24hrs", status: "pass" },
    ],
    overallStatus: "pass"
  },
];

const DEFECTS = [
  { id: "DEF001", project: "Sector 62 Commercial", location: "8th Floor – Col C3", type: "Honeycombing", severity: "major", reportedDate: "2024-06-17", status: "under_repair", assignedTo: "Rohit Agarwal" },
  { id: "DEF002", project: "Green Valley Residences", location: "Block A – Level 2 Slab", type: "Surface Crack (hairline)", severity: "minor", reportedDate: "2024-06-14", status: "repaired", assignedTo: "Amit Singh" },
  { id: "DEF003", project: "Patel Residence", location: "Ground Floor – Plumbing", type: "Pipe misalignment", severity: "minor", reportedDate: "2024-06-12", status: "pending", assignedTo: "Sanjay Tiwari" },
  { id: "DEF004", project: "Township Phase 2", location: "Foundation Zone 2B", type: "Settlement crack", severity: "major", reportedDate: "2024-06-10", status: "under_review", assignedTo: "Priya Gupta" },
];

const TESTS = [
  { id: "T001", test: "Cube Test – M30 Concrete", project: "Sector 62 Commercial", date: "2024-06-15", lab: "In-House", result: "31.2 N/mm²", status: "pass", notes: "Satisfactory — exceeds M30 target" },
  { id: "T002", test: "Slump Test", project: "Sector 62 Commercial", date: "2024-06-17", lab: "On-Site", result: "45mm (target 75±25)", status: "fail", notes: "Below range — mix adjusted" },
  { id: "T003", test: "Steel Tensile Test (Fe500)", project: "All Projects", date: "2024-06-10", lab: "3rd Party", result: "508 N/mm²", status: "pass", notes: "TATA TMT Fe500 — within spec" },
  { id: "T004", test: "Compaction Test – Backfill", project: "Township Phase 2", date: "2024-06-12", lab: "On-Site", result: "98.2% MDD", status: "pass", notes: "Modified Proctor compliance" },
  { id: "T005", test: "Water Quality Test", project: "All Projects", date: "2024-06-01", lab: "3rd Party", result: "pH 7.2 — potable", status: "pass", notes: "IS 456 compliant" },
];

function QualityControl() {
  const [open, setOpen] = useState(false);
  const passedTests = TESTS.filter(t => t.status === "pass").length;
  const openDefects = DEFECTS.filter(d => d.status !== "repaired").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Quality Control</h1>
          <p className="text-sm text-muted-foreground mt-1">Inspection checklists, defect tracking, testing reports, and compliance</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Inspection</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Quality Inspection Checklist</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Project</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="s62">Sector 62 Commercial</SelectItem>
                      <SelectItem value="gv">Green Valley Residences</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Activity</Label><Input placeholder="Column Casting – 9th Floor" /></div>
              </div>
              <div className="space-y-1"><Label>Inspector</Label><Input placeholder="Inspector name" /></div>
              <div className="space-y-1"><Label>Remarks</Label><Textarea placeholder="General observations..." rows={3} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => { toast.success("Inspection checklist created"); setOpen(false); }}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Inspections (June)", value: CHECKLISTS.length, icon: ClipboardList, color: "text-blue-600" },
          { label: "Tests Passed", value: `${passedTests}/${TESTS.length}`, icon: CheckCircle, color: "text-green-600" },
          { label: "Open Defects", value: openDefects, icon: AlertTriangle, color: "text-red-500" },
          { label: "Compliance Rate", value: "94%", icon: ShieldCheck, color: "text-purple-600" },
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

      <Tabs defaultValue="checklists">
        <TabsList>
          <TabsTrigger value="checklists">Inspection Checklists</TabsTrigger>
          <TabsTrigger value="defects">Defect Tracker</TabsTrigger>
          <TabsTrigger value="tests">Testing Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="checklists" className="mt-4 space-y-4">
          {CHECKLISTS.map(qc => (
            <Card key={qc.id} className={qc.overallStatus === "fail" ? "border-red-200" : "border-green-200"}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{qc.activity}</span>
                      <Badge variant="outline" className="text-xs">{qc.project}</Badge>
                      <Badge className={qc.overallStatus === "pass" ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-600 border-red-200"}>
                        {qc.overallStatus === "pass" ? "✓ Passed" : "✗ Failed"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{qc.date} · Inspector: {qc.inspector}</p>
                  </div>
                  <Button variant="ghost" size="sm"><ClipboardList className="h-4 w-4" /></Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {qc.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {item.status === "pass"
                        ? <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                        : <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                      }
                      <span className={item.status === "fail" ? "text-red-700 font-medium" : "text-muted-foreground"}>{item.item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="defects" className="mt-4">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{["ID","Project","Location","Defect Type","Severity","Assigned To","Status","Action"].map(h => <th key={h} className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {DEFECTS.map(d => (
                  <tr key={d.id} className="hover:bg-muted/20">
                    <td className="px-3 py-3 font-mono text-xs font-semibold">{d.id}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{d.project}</td>
                    <td className="px-3 py-3 text-xs">{d.location}</td>
                    <td className="px-3 py-3 font-medium text-sm">{d.type}</td>
                    <td className="px-3 py-3">
                      <Badge className={d.severity === "major" ? "bg-red-100 text-red-600 border-red-200" : "bg-amber-100 text-amber-700 border-amber-200"} variant="outline">{d.severity}</Badge>
                    </td>
                    <td className="px-3 py-3 text-xs">{d.assignedTo}</td>
                    <td className="px-3 py-3">
                      <Badge className={d.status === "repaired" ? "bg-green-100 text-green-700 border-green-200" : d.status === "under_repair" ? "bg-blue-100 text-blue-700 border-blue-200" : d.status === "pending" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-purple-100 text-purple-700 border-purple-200"}>
                        {d.status.replace("_"," ")}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      {d.status !== "repaired" && <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => toast.success("Status updated")}>Update</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="tests" className="mt-4 space-y-3">
          {TESTS.map(t => (
            <Card key={t.id} className={t.status === "fail" ? "border-red-200 bg-red-50" : ""}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-full p-1.5 mt-0.5 ${t.status === "pass" ? "bg-green-100" : "bg-red-100"}`}>
                      <FlaskConical className={`h-3.5 w-3.5 ${t.status === "pass" ? "text-green-600" : "text-red-600"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{t.test}</span>
                        <Badge variant="outline" className="text-xs">{t.project}</Badge>
                        <Badge variant="outline" className="text-xs">{t.lab} Lab</Badge>
                      </div>
                      <p className="text-sm font-mono">Result: <span className={`font-bold ${t.status === "pass" ? "text-green-700" : "text-red-700"}`}>{t.result}</span></p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.notes}</p>
                      <p className="text-xs text-muted-foreground">{t.date}</p>
                    </div>
                  </div>
                  <Badge className={t.status === "pass" ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-600 border-red-200"}>
                    {t.status === "pass" ? "✓ Pass" : "✗ Fail"}
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
