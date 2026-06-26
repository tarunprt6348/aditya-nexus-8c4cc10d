import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { IndianRupee, TrendingUp, TrendingDown, Plus, Download, FileText, CreditCard, PieChart, BarChart2 } from "lucide-react";
import { PermissionGuard } from "@/components/site/PermissionGuard";

export const Route = createFileRoute("/_authenticated/admin/finance")({
  head: () => ({ meta: [{ title: "Financial Management — Operations" }] }),
  component: () => <PermissionGuard module="finance"><FinancialManagement /></PermissionGuard>,
});

const EXPENSES = [
  { id: "EXP001", category: "Materials", description: "Cement & Steel – Sector 62", amount: 485000, date: "2024-06-15", project: "Sector 62 Commercial", status: "approved" },
  { id: "EXP002", category: "Labour", description: "June Labour Payroll", amount: 320000, date: "2024-06-01", project: "All Projects", status: "paid" },
  { id: "EXP003", category: "Equipment", description: "Crane Rental – June", amount: 95000, date: "2024-06-10", project: "Green Valley Residences", status: "paid" },
  { id: "EXP004", category: "Contractor", description: "Plumbing Work – Phase 2", amount: 180000, date: "2024-06-12", project: "Township Phase 2", status: "approved" },
  { id: "EXP005", category: "Overhead", description: "Office Utilities & Admin", amount: 42000, date: "2024-06-01", project: "Corporate", status: "paid" },
  { id: "EXP006", category: "Marketing", description: "Digital Marketing – June", amount: 35000, date: "2024-06-05", project: "Corporate", status: "approved" },
];

const INCOME = [
  { id: "INC001", client: "Metro Infra Pvt Ltd", description: "Milestone 3 – Structural", amount: 1200000, date: "2024-06-18", project: "Sector 62 Commercial", status: "received" },
  { id: "INC002", client: "Green Valley Developers", description: "Progress Payment – Q2", amount: 850000, date: "2024-06-10", project: "Green Valley Residences", status: "received" },
  { id: "INC003", client: "Rajesh Kumar Builders", description: "Final Payment – Interior", amount: 420000, date: "2024-06-05", project: "RK Interior", status: "received" },
  { id: "INC004", client: "Patel Family Home", description: "Advance – 30%", amount: 660000, date: "2024-05-28", project: "Patel Residence", status: "received" },
  { id: "INC005", client: "Sunita Agarwal", description: "Balance Payment", amount: 380000, date: "2024-06-20", project: "Agarwal Interior", status: "pending" },
];

const INVOICES = [
  { id: "INV-2024-089", client: "Metro Infra Pvt Ltd", amount: 1500000, issued: "2024-06-15", due: "2024-07-15", status: "sent" },
  { id: "INV-2024-088", client: "Green Valley Developers", amount: 950000, issued: "2024-06-10", due: "2024-07-10", status: "sent" },
  { id: "INV-2024-085", client: "Patel Family Home", amount: 660000, issued: "2024-05-25", due: "2024-06-25", status: "paid" },
  { id: "INV-2024-083", client: "Rajesh Kumar Builders", amount: 420000, issued: "2024-05-20", due: "2024-06-20", status: "paid" },
  { id: "INV-2024-079", client: "Township Authority", amount: 2800000, issued: "2024-05-01", due: "2024-06-01", status: "overdue" },
];

const BUDGETS = [
  { project: "Sector 62 Commercial", budget: 8500000, spent: 5200000 },
  { project: "Green Valley Residences", budget: 4200000, spent: 2800000 },
  { project: "Township Phase 2", budget: 12000000, spent: 3100000 },
  { project: "Patel Residence", budget: 2200000, spent: 890000 },
];

function FinancialManagement() {
  const [open, setOpen] = useState(false);
  const totalIncome = INCOME.filter(i => i.status === "received").reduce((s, i) => s + i.amount, 0);
  const totalExpense = EXPENSES.filter(e => e.status === "paid").reduce((s, e) => s + e.amount, 0);
  const pendingInvoices = INVOICES.filter(i => i.status === "sent").reduce((s, i) => s + i.amount, 0);
  const overdueAmount = INVOICES.filter(i => i.status === "overdue").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Financial Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Budgets, expenses, income, invoices, and financial reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Entry</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Financial Entry</DialogTitle></DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="space-y-1"><Label>Type</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Income / Expense" /></SelectTrigger>
                    <SelectContent><SelectItem value="income">Income</SelectItem><SelectItem value="expense">Expense</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Amount (₹)</Label><Input type="number" placeholder="500000" /></div>
                  <div className="space-y-1"><Label>Date</Label><Input type="date" /></div>
                </div>
                <div className="space-y-1"><Label>Category</Label><Input placeholder="Materials / Labour / Overhead…" /></div>
                <div className="space-y-1"><Label>Description</Label><Input placeholder="Brief description" /></div>
                <div className="space-y-1"><Label>Project</Label><Input placeholder="Sector 62 Commercial" /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => { toast.success("Entry added"); setOpen(false); }}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Income (June)", value: `₹${(totalIncome/100000).toFixed(1)}L`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          { label: "Total Expenses (June)", value: `₹${(totalExpense/100000).toFixed(1)}L`, icon: TrendingDown, color: "text-red-500", bg: "bg-red-50" },
          { label: "Pending Invoices", value: `₹${(pendingInvoices/100000).toFixed(1)}L`, icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Overdue Amount", value: `₹${(overdueAmount/100000).toFixed(1)}L`, icon: CreditCard, color: "text-red-600", bg: "bg-red-50" },
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

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Budget Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Project Budget Utilization</h3>
          {BUDGETS.map((b, i) => {
            const pct = Math.round((b.spent / b.budget) * 100);
            return (
              <Card key={i}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-sm">{b.project}</span>
                    <span className="text-xs text-muted-foreground">₹{(b.spent/100000).toFixed(1)}L / ₹{(b.budget/100000).toFixed(1)}L ({pct}%)</span>
                  </div>
                  <Progress value={pct} className={`h-2 ${pct > 85 ? "[&>div]:bg-red-500" : pct > 70 ? "[&>div]:bg-amber-500" : "[&>div]:bg-green-500"}`} />
                </CardContent>
              </Card>
            );
          })}
          <div className="grid grid-cols-2 gap-4 mt-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Expense Breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {[["Materials","41%","bg-blue-500"],["Labour","27%","bg-green-500"],["Equipment","8%","bg-purple-500"],["Contractor","15%","bg-amber-500"],["Overhead/Other","9%","bg-gray-400"]].map(([label, pct, color]) => (
                  <div key={label as string} className="flex items-center gap-2 text-xs">
                    <div className={`h-2 rounded-full ${color}`} style={{ width: pct as string }} />
                    <span className="text-muted-foreground">{label}</span>
                    <span className="ml-auto font-semibold">{pct}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">P&L Summary — June 2026</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Revenue</span><span className="font-semibold text-green-700">₹{(totalIncome/100000).toFixed(1)}L</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Expenses</span><span className="font-semibold text-red-600">₹{(totalExpense/100000).toFixed(1)}L</span></div>
                <hr />
                <div className="flex justify-between font-bold"><span>Net Profit</span><span className="text-green-700">₹{((totalIncome - totalExpense)/100000).toFixed(1)}L</span></div>
                <div className="flex justify-between text-xs text-muted-foreground"><span>Margin</span><span>{Math.round(((totalIncome - totalExpense) / totalIncome) * 100)}%</span></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{["ID","Category","Description","Project","Amount","Date","Status"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {EXPENSES.map(e => (
                  <tr key={e.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs">{e.id}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{e.category}</Badge></td>
                    <td className="px-4 py-3 text-sm">{e.description}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{e.project}</td>
                    <td className="px-4 py-3 font-semibold text-red-600">₹{e.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{e.date}</td>
                    <td className="px-4 py-3"><Badge className={e.status === "paid" ? "bg-green-100 text-green-700 border-green-200" : "bg-amber-100 text-amber-700 border-amber-200"}>{e.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="income" className="mt-4">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{["ID","Client","Description","Project","Amount","Date","Status"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {INCOME.map(i => (
                  <tr key={i.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs">{i.id}</td>
                    <td className="px-4 py-3 font-medium">{i.client}</td>
                    <td className="px-4 py-3 text-sm">{i.description}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{i.project}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">₹{i.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{i.date}</td>
                    <td className="px-4 py-3"><Badge className={i.status === "received" ? "bg-green-100 text-green-700 border-green-200" : "bg-amber-100 text-amber-700 border-amber-200"}>{i.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{["Invoice No","Client","Amount","Issued","Due Date","Status","Action"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {INVOICES.map(inv => (
                  <tr key={inv.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{inv.id}</td>
                    <td className="px-4 py-3 font-medium">{inv.client}</td>
                    <td className="px-4 py-3 font-semibold">₹{inv.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{inv.issued}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{inv.due}</td>
                    <td className="px-4 py-3">
                      <Badge className={inv.status === "paid" ? "bg-green-100 text-green-700 border-green-200" : inv.status === "overdue" ? "bg-red-100 text-red-600 border-red-200" : "bg-amber-100 text-amber-700 border-amber-200"}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => toast.info(`Downloading ${inv.id}`)}><Download className="h-3 w-3" /></Button>
                      {inv.status !== "paid" && <Button size="sm" variant="outline" onClick={() => toast.success("Reminder sent")}>Remind</Button>}
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
