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
import { Plus, Package, AlertTriangle, TrendingDown, BarChart2, Search, ArrowUpDown, Warehouse } from "lucide-react";
import { PermissionGuard } from "@/components/site/PermissionGuard";

export const Route = createFileRoute("/_authenticated/admin/materials")({
  head: () => ({ meta: [{ title: "Materials — Operations" }] }),
  component: () => <PermissionGuard module="materials"><Materials /></PermissionGuard>,
});

const INVENTORY = [
  { id: "MAT001", name: "OPC Cement", category: "Cement", unit: "Bags", stock: 420, minStock: 200, maxStock: 1000, rate: 380, supplier: "Buildex Materials", location: "Warehouse A", lastUpdated: "2024-06-17" },
  { id: "MAT002", name: "TMT Steel Bars (Fe500)", category: "Steel", unit: "MT", stock: 12.5, minStock: 10, maxStock: 50, rate: 62000, supplier: "Buildex Materials", location: "Yard 1", lastUpdated: "2024-06-16" },
  { id: "MAT003", name: "River Sand", category: "Aggregates", unit: "CFT", stock: 850, minStock: 500, maxStock: 2000, rate: 55, supplier: "Delhi Sand Co.", location: "Yard 2", lastUpdated: "2024-06-15" },
  { id: "MAT004", name: "20mm Crushed Stone", category: "Aggregates", unit: "CFT", stock: 180, minStock: 400, maxStock: 1500, rate: 48, supplier: "Delhi Sand Co.", location: "Yard 2", lastUpdated: "2024-06-14" },
  { id: "MAT005", name: "AAC Blocks", category: "Masonry", unit: "Nos", stock: 2400, minStock: 1000, maxStock: 8000, rate: 48, supplier: "AACBlox India", location: "Warehouse B", lastUpdated: "2024-06-18" },
  { id: "MAT006", name: "Ceramic Floor Tiles", category: "Finishes", unit: "Sqft", stock: 3200, minStock: 1000, maxStock: 10000, rate: 85, supplier: "Somany Tiles", location: "Warehouse C", lastUpdated: "2024-06-17" },
  { id: "MAT007", name: "PVC Pipes (4 inch)", category: "Plumbing", unit: "Rmt", stock: 380, minStock: 200, maxStock: 800, rate: 320, supplier: "AquaPlumb", location: "Warehouse B", lastUpdated: "2024-06-16" },
  { id: "MAT008", name: "6mm PVC Wire", category: "Electrical", unit: "Mtrs", stock: 85, minStock: 200, maxStock: 1000, rate: 55, supplier: "SafeElec Pvt Ltd", location: "Warehouse A", lastUpdated: "2024-06-13" },
];

const REQUESTS = [
  { id: "PR001", material: "OPC Cement", qty: 200, unit: "Bags", project: "Sector 62 Commercial", requestedBy: "Rohit Agarwal", date: "2024-06-18", status: "approved", priority: "high" },
  { id: "PR002", material: "TMT Steel Bars", qty: 5, unit: "MT", project: "Township Phase 2", requestedBy: "Amit Singh", date: "2024-06-17", status: "pending", priority: "high" },
  { id: "PR003", material: "AAC Blocks", qty: 1000, unit: "Nos", project: "Green Valley Residences", requestedBy: "Sanjay Tiwari", date: "2024-06-17", status: "pending", priority: "medium" },
  { id: "PR004", material: "6mm PVC Wire", qty: 300, unit: "Mtrs", project: "All Projects", requestedBy: "Operations Manager", date: "2024-06-16", status: "issued", priority: "urgent" },
  { id: "PR005", material: "Ceramic Floor Tiles", qty: 800, unit: "Sqft", project: "Patel Residence", requestedBy: "Priya Gupta", date: "2024-06-15", status: "approved", priority: "low" },
];

const CONSUMPTION = [
  { month: "Jan", cement: 380, steel: 8.2, aggregates: 1200 },
  { month: "Feb", cement: 420, steel: 9.5, aggregates: 1350 },
  { month: "Mar", cement: 510, steel: 11.2, aggregates: 1600 },
  { month: "Apr", cement: 480, steel: 10.8, aggregates: 1480 },
  { month: "May", cement: 550, steel: 12.0, aggregates: 1700 },
  { month: "Jun", cement: 390, steel: 8.5, aggregates: 1100 },
];

function Materials() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [reqOpen, setReqOpen] = useState(false);

  const lowStock = INVENTORY.filter(m => m.stock < m.minStock);
  const totalValue = INVENTORY.reduce((s, m) => s + m.stock * m.rate, 0);

  const filtered = INVENTORY.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.category.toLowerCase().includes(search.toLowerCase())
  );

  function statusBadge(m: typeof INVENTORY[0]) {
    const pct = (m.stock / m.maxStock) * 100;
    if (m.stock < m.minStock) return <Badge className="bg-red-100 text-red-600 border-red-200 text-xs">Low Stock</Badge>;
    if (pct > 70) return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Good</Badge>;
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Moderate</Badge>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Material Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Inventory, purchase requests, issue records, and consumption</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={reqOpen} onOpenChange={setReqOpen}>
            <DialogTrigger asChild><Button variant="outline"><Plus className="h-4 w-4 mr-2" />Request Material</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Material Purchase Request</DialogTitle></DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="space-y-1"><Label>Material</Label><Input placeholder="OPC Cement" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Quantity</Label><Input type="number" placeholder="200" /></div>
                  <div className="space-y-1"><Label>Unit</Label><Input placeholder="Bags / MT / Sqft" /></div>
                </div>
                <div className="space-y-1"><Label>Project</Label><Input placeholder="Sector 62 Commercial" /></div>
                <div className="space-y-1"><Label>Priority</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setReqOpen(false)}>Cancel</Button>
                <Button onClick={() => { toast.success("Purchase request submitted"); setReqOpen(false); }}>Submit Request</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Material</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Material to Inventory</DialogTitle></DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Material Name</Label><Input placeholder="OPC Cement" /></div>
                  <div className="space-y-1"><Label>Category</Label><Input placeholder="Cement / Steel / Aggregates" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1"><Label>Unit</Label><Input placeholder="Bags" /></div>
                  <div className="space-y-1"><Label>Opening Stock</Label><Input type="number" placeholder="0" /></div>
                  <div className="space-y-1"><Label>Rate (₹)</Label><Input type="number" placeholder="380" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Min Stock</Label><Input type="number" placeholder="200" /></div>
                  <div className="space-y-1"><Label>Max Stock</Label><Input type="number" placeholder="1000" /></div>
                </div>
                <div className="space-y-1"><Label>Supplier</Label><Input placeholder="Buildex Materials" /></div>
                <div className="space-y-1"><Label>Storage Location</Label><Input placeholder="Warehouse A" /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => { toast.success("Material added to inventory"); setOpen(false); }}>Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {lowStock.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-semibold text-sm">Low Stock Alert — {lowStock.length} item(s) below minimum</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStock.map(m => (
                <Badge key={m.id} className="bg-red-100 text-red-700 border-red-300">{m.name} ({m.stock} {m.unit})</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Items", value: INVENTORY.length, icon: Package },
          { label: "Low Stock Items", value: lowStock.length, icon: AlertTriangle },
          { label: "Pending Requests", value: REQUESTS.filter(r => r.status === "pending").length, icon: ArrowUpDown },
          { label: "Inventory Value", value: `₹${(totalValue/100000).toFixed(1)}L`, icon: BarChart2 },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-2xl font-bold mt-1">{s.value}</p></div>
                <s.icon className="h-8 w-8 text-muted-foreground opacity-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="requests">Purchase Requests</TabsTrigger>
          <TabsTrigger value="consumption">Consumption</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search materials..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{["Material","Category","Stock","Min","Max","Rate","Supplier","Location","Status"].map(h => <th key={h} className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(m => (
                  <tr key={m.id} className="hover:bg-muted/20">
                    <td className="px-3 py-3 font-medium text-sm">{m.name}</td>
                    <td className="px-3 py-3"><Badge variant="outline" className="text-xs">{m.category}</Badge></td>
                    <td className="px-3 py-3 font-semibold">{m.stock} <span className="text-xs text-muted-foreground">{m.unit}</span></td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{m.minStock}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{m.maxStock}</td>
                    <td className="px-3 py-3 text-xs">₹{m.rate.toLocaleString()}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{m.supplier}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{m.location}</td>
                    <td className="px-3 py-3">{statusBadge(m)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{["ID","Material","Qty","Project","Requested By","Date","Priority","Status","Action"].map(h => <th key={h} className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {REQUESTS.map(r => (
                  <tr key={r.id} className="hover:bg-muted/20">
                    <td className="px-3 py-3 font-mono text-xs font-semibold">{r.id}</td>
                    <td className="px-3 py-3 font-medium">{r.material}</td>
                    <td className="px-3 py-3">{r.qty} <span className="text-xs text-muted-foreground">{r.unit}</span></td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{r.project}</td>
                    <td className="px-3 py-3 text-xs">{r.requestedBy}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{r.date}</td>
                    <td className="px-3 py-3">
                      <Badge className={r.priority === "urgent" ? "bg-red-100 text-red-700 border-red-200" : r.priority === "high" ? "bg-amber-100 text-amber-700 border-amber-200" : r.priority === "medium" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-600"} variant="outline">{r.priority}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      <Badge className={r.status === "approved" || r.status === "issued" ? "bg-green-100 text-green-700 border-green-200" : "bg-amber-100 text-amber-700 border-amber-200"}>{r.status}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      {r.status === "pending" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => toast.success("Request approved")}>Approve</Button>
                          <Button size="sm" variant="ghost" className="h-6 text-xs text-red-600" onClick={() => toast.error("Request rejected")}>Reject</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="consumption" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Monthly Material Consumption (2026)</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Month</th>
                      <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Cement (Bags)</th>
                      <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Steel (MT)</th>
                      <th className="pb-3 text-right text-xs font-medium text-muted-foreground">Aggregates (CFT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {CONSUMPTION.map(c => (
                      <tr key={c.month} className="hover:bg-muted/20">
                        <td className="py-3 font-medium">{c.month}</td>
                        <td className="py-3 text-right">{c.cement}</td>
                        <td className="py-3 text-right">{c.steel}</td>
                        <td className="py-3 text-right">{c.aggregates}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
