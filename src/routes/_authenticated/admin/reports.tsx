import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { BarChart2, Download, FileText, TrendingUp, TrendingDown, Users, Wrench, Package, Building2 } from "lucide-react";
import { PermissionGuard } from "@/components/site/PermissionGuard";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () => ({ meta: [{ title: "Reports & Analytics — Operations" }] }),
  component: () => <PermissionGuard module="reports"><Reports /></PermissionGuard>,
});

const PROJECT_STATS = [
  { name: "Sector 62 Commercial", progress: 62, budget: 8500000, spent: 5200000, onTime: true, health: "good" },
  { name: "Green Valley Residences", progress: 48, budget: 4200000, spent: 2800000, onTime: true, health: "good" },
  { name: "Township Phase 2", progress: 26, budget: 12000000, spent: 3100000, onTime: false, health: "at_risk" },
  { name: "Patel Residence", progress: 40, budget: 2200000, spent: 890000, onTime: true, health: "good" },
];

const MONTHLY_FINANCE = [
  { month: "Jan", income: 2800000, expense: 1900000 },
  { month: "Feb", income: 3200000, expense: 2100000 },
  { month: "Mar", income: 4100000, expense: 2800000 },
  { month: "Apr", income: 3600000, expense: 2400000 },
  { month: "May", income: 4800000, expense: 3100000 },
  { month: "Jun", income: 3510000, expense: 1157000 },
];

const EMPLOYEE_STATS = [
  { name: "Rahul Sharma", role: "HR Manager", attendance: 95, tasks: 20, completion: 85, leaves: 1 },
  { name: "Priya Gupta", role: "Project Manager", attendance: 98, tasks: 28, completion: 93, leaves: 0 },
  { name: "Amit Singh", role: "Site Engineer", attendance: 97, tasks: 42, completion: 90, leaves: 0 },
  { name: "Deepak Joshi", role: "Sales Manager", attendance: 92, tasks: 35, completion: 89, leaves: 2 },
  { name: "Arjun Mehta", role: "Accountant", attendance: 96, tasks: 18, completion: 83, leaves: 1 },
  { name: "Pooja Sharma", role: "Marketing Mgr", attendance: 90, tasks: 22, completion: 77, leaves: 2 },
];

const EQUIPMENT_STATS = [
  { name: "Tower Crane TC-48", utilization: 92, downtime: "0 hrs", maintenanceCost: 35000 },
  { name: "JCB 3DX Backhoe", utilization: 78, downtime: "8 hrs", maintenanceCost: 8500 },
  { name: "Concrete Mixer 10/7", utilization: 45, downtime: "0 hrs", maintenanceCost: 0 },
  { name: "Transit Mixer (Rented)", utilization: 85, downtime: "4 hrs", maintenanceCost: 6000 },
  { name: "Plate Compactor", utilization: 0, downtime: "48 hrs", maintenanceCost: 12000 },
];

const MATERIAL_STATS = [
  { material: "OPC Cement", consumed: 2930, unit: "Bags", value: 1113400, wastage: "2.1%" },
  { material: "TMT Steel", consumed: 59.7, unit: "MT", value: 3695400, wastage: "0.8%" },
  { material: "River Sand", consumed: 7480, unit: "CFT", value: 411400, wastage: "3.2%" },
  { material: "Crushed Stone", consumed: 6200, unit: "CFT", value: 297600, wastage: "2.5%" },
  { material: "AAC Blocks", consumed: 8400, unit: "Nos", value: 403200, wastage: "1.8%" },
];

function Reports() {
  const [reportType, setReportType] = useState("project");
  const [period, setPeriod] = useState("june_2026");

  const totalIncome = MONTHLY_FINANCE.reduce((s, m) => s + m.income, 0);
  const totalExpense = MONTHLY_FINANCE.reduce((s, m) => s + m.expense, 0);
  const netProfit = totalIncome - totalExpense;
  const margin = Math.round((netProfit / totalIncome) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Project, financial, employee, equipment, and material reports</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="june_2026">June 2026</SelectItem>
              <SelectItem value="q2_2026">Q2 2026</SelectItem>
              <SelectItem value="fy_2026">FY 2025-26</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => toast.success("Report exported to PDF")}><Download className="h-4 w-4 mr-2" />Export PDF</Button>
          <Button variant="outline" onClick={() => toast.success("Report exported to Excel")}><Download className="h-4 w-4 mr-2" />Excel</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue (YTD)", value: `₹${(totalIncome/100000).toFixed(1)}L`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          { label: "Total Expenses (YTD)", value: `₹${(totalExpense/100000).toFixed(1)}L`, icon: TrendingDown, color: "text-red-500", bg: "bg-red-50" },
          { label: "Net Profit (YTD)", value: `₹${(netProfit/100000).toFixed(1)}L`, icon: BarChart2, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Profit Margin", value: `${margin}%`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold mt-1">{s.value}</p></div>
                <div className={`rounded-lg p-2 ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="projects">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="projects"><Building2 className="h-3.5 w-3.5 mr-1" />Projects</TabsTrigger>
          <TabsTrigger value="finance"><TrendingUp className="h-3.5 w-3.5 mr-1" />Financial</TabsTrigger>
          <TabsTrigger value="employees"><Users className="h-3.5 w-3.5 mr-1" />Employees</TabsTrigger>
          <TabsTrigger value="equipment"><Wrench className="h-3.5 w-3.5 mr-1" />Equipment</TabsTrigger>
          <TabsTrigger value="materials"><Package className="h-3.5 w-3.5 mr-1" />Materials</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-4 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Project Health Overview</h3>
          {PROJECT_STATS.map((p, i) => (
            <Card key={i}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{p.name}</span>
                      <Badge className={p.health === "good" ? "bg-green-100 text-green-700 border-green-200 text-xs" : "bg-amber-100 text-amber-700 border-amber-200 text-xs"}>
                        {p.health === "good" ? "On Track" : "At Risk"}
                      </Badge>
                      <Badge className={p.onTime ? "bg-blue-100 text-blue-700 border-blue-200 text-xs" : "bg-red-100 text-red-600 border-red-200 text-xs"}>
                        {p.onTime ? "On Time" : "Delayed"}
                      </Badge>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Budget: ₹{(p.budget/100000).toFixed(0)}L</span>
                      <span>Spent: ₹{(p.spent/100000).toFixed(1)}L</span>
                      <span>Remaining: ₹{((p.budget-p.spent)/100000).toFixed(1)}L</span>
                      <span>Utilization: {Math.round((p.spent/p.budget)*100)}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{p.progress}%</p>
                    <p className="text-xs text-muted-foreground">Complete</p>
                  </div>
                </div>
                <Progress value={p.progress} className="h-2" />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="finance" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Monthly Revenue vs Expenses (2026)</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MONTHLY_FINANCE.map((m, i) => {
                  const maxVal = 5000000;
                  const incomePct = (m.income / maxVal) * 100;
                  const expPct = (m.expense / maxVal) * 100;
                  const profit = m.income - m.expense;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="font-medium">{m.month}</span>
                        <span className="text-green-700 font-semibold">Net: ₹{(profit/100000).toFixed(1)}L</span>
                      </div>
                      <div className="flex gap-1 h-4">
                        <div className="bg-green-400 rounded-sm transition-all" style={{ width: `${incomePct}%` }} title={`Income: ₹${(m.income/100000).toFixed(1)}L`} />
                      </div>
                      <div className="flex gap-1 h-3">
                        <div className="bg-red-300 rounded-sm transition-all" style={{ width: `${expPct}%` }} title={`Expense: ₹${(m.expense/100000).toFixed(1)}L`} />
                      </div>
                    </div>
                  );
                })}
                <div className="flex gap-4 text-xs text-muted-foreground pt-2">
                  <span className="flex items-center gap-1"><span className="h-2 w-4 bg-green-400 rounded-sm inline-block" />Income</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-4 bg-red-300 rounded-sm inline-block" />Expense</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="mt-4">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{["Employee","Role","Attendance %","Tasks Assigned","Completion %","Leaves"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {EMPLOYEE_STATS.map((e, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{e.name}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{e.role}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={e.attendance} className="w-16 h-1.5" />
                        <span className="text-xs font-semibold">{e.attendance}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">{e.tasks}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={e.completion} className={`w-16 h-1.5 ${e.completion >= 90 ? "[&>div]:bg-green-500" : e.completion >= 80 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"}`} />
                        <span className="text-xs font-semibold">{e.completion}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{e.leaves}</td>
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
                <tr>{["Equipment","Utilization","Downtime","Maintenance Cost"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {EQUIPMENT_STATS.map((e, i) => (
                  <tr key={i} className={`hover:bg-muted/20 ${e.utilization === 0 ? "bg-red-50" : ""}`}>
                    <td className="px-4 py-3 font-medium">{e.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={e.utilization} className={`w-20 h-2 ${e.utilization === 0 ? "[&>div]:bg-red-500" : "[&>div]:bg-blue-500"}`} />
                        <span className="text-xs font-semibold">{e.utilization}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{e.downtime}</td>
                    <td className="px-4 py-3 font-semibold">₹{e.maintenanceCost.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="materials" className="mt-4">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{["Material","Consumed","Unit","Total Value","Wastage"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MATERIAL_STATS.map((m, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{m.material}</td>
                    <td className="px-4 py-3 font-semibold">{m.consumed.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.unit}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">₹{m.value.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Badge className={parseFloat(m.wastage) > 3 ? "bg-red-100 text-red-600 border-red-200" : "bg-green-100 text-green-700 border-green-200"} variant="outline">{m.wastage}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
