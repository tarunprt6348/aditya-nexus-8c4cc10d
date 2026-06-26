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
import { toast } from "sonner";
import { Plus, ShoppingCart, FileText, Truck, CheckCircle, Clock, Search, IndianRupee } from "lucide-react";
import { PermissionGuard } from "@/components/site/PermissionGuard";

export const Route = createFileRoute("/_authenticated/admin/procurement")({
  head: () => ({ meta: [{ title: "Procurement — Operations" }] }),
  component: () => <PermissionGuard module="procurement"><Procurement /></PermissionGuard>,
});

const PURCHASE_ORDERS = [
  { id: "PO-2024-052", supplier: "Buildex Materials Pvt Ltd", items: "OPC Cement 300 bags + TMT Steel 5MT", amount: 444400, issued: "2024-06-10", expectedDelivery: "2024-06-20", status: "delivered", project: "Sector 62 Commercial" },
  { id: "PO-2024-053", supplier: "AACBlox India", items: "AAC Blocks 2000 nos", amount: 96000, issued: "2024-06-12", expectedDelivery: "2024-06-22", status: "in_transit", project: "Green Valley Residences" },
  { id: "PO-2024-054", supplier: "SafeElec Pvt Ltd", items: "6mm PVC Wire 500m + Switches", amount: 48500, issued: "2024-06-15", expectedDelivery: "2024-06-25", status: "confirmed", project: "All Projects" },
  { id: "PO-2024-055", supplier: "Somany Tiles", items: "Ceramic Floor Tiles 1500 Sqft", amount: 127500, issued: "2024-06-16", expectedDelivery: "2024-06-28", status: "pending_approval", project: "Patel Residence" },
  { id: "PO-2024-056", supplier: "Delhi Sand Co.", items: "River Sand 500 CFT", amount: 27500, issued: "2024-06-18", expectedDelivery: "2024-06-21", status: "pending_approval", project: "Township Phase 2" },
];

const RFQS = [
  { id: "RFQ-2024-018", material: "M30 Ready Mix Concrete", qty: "150 CUM", suppliers: ["ConcreteX", "RMC India", "UltraTech RMC"], deadline: "2024-06-22", status: "open" },
  { id: "RFQ-2024-019", material: "UPVC Windows (standard sizes)", qty: "85 nos", suppliers: ["Fenesta", "LG Windows", "Veka India"], deadline: "2024-06-25", status: "open" },
  { id: "RFQ-2024-017", material: "MS Structural Steel (various sections)", qty: "8 MT", suppliers: ["JSW Steel", "SAIL", "Tata Steel"], deadline: "2024-06-18", status: "received_quotes" },
];

const COMPARISONS = [
  {
    rfq: "RFQ-2024-017",
    material: "MS Structural Steel 8 MT",
    quotes: [
      { supplier: "JSW Steel", rate: 68500, delivery: "5 days", warranty: "Yes", recommended: false },
      { supplier: "SAIL", rate: 65000, delivery: "7 days", warranty: "Yes", recommended: true },
      { supplier: "Tata Steel", rate: 70000, delivery: "3 days", warranty: "Yes", recommended: false },
    ],
  },
];

const DELIVERIES = [
  { po: "PO-2024-052", supplier: "Buildex Materials", item: "OPC Cement + Steel", expected: "2024-06-20", actual: "2024-06-19", status: "delivered", qcPassed: true },
  { po: "PO-2024-053", supplier: "AACBlox India", item: "AAC Blocks", expected: "2024-06-22", actual: "—", status: "in_transit", qcPassed: null },
  { po: "PO-2024-054", supplier: "SafeElec", item: "Wires + Switches", expected: "2024-06-25", actual: "—", status: "not_dispatched", qcPassed: null },
];

function Procurement() {
  const [open, setOpen] = useState(false);

  const pendingApproval = PURCHASE_ORDERS.filter(p => p.status === "pending_approval").length;
  const inTransit = PURCHASE_ORDERS.filter(p => p.status === "in_transit").length;
  const totalValue = PURCHASE_ORDERS.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Procurement Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Purchase orders, RFQs, supplier comparison, and delivery tracking</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Purchase Order</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Purchase Order</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="space-y-1"><Label>Supplier</Label><Input placeholder="Supplier name" /></div>
              <div className="space-y-1"><Label>Items / Description</Label><Input placeholder="OPC Cement 200 bags, TMT Steel 3 MT…" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Total Amount (₹)</Label><Input type="number" placeholder="250000" /></div>
                <div className="space-y-1"><Label>Expected Delivery</Label><Input type="date" /></div>
              </div>
              <div className="space-y-1"><Label>Project</Label><Input placeholder="Sector 62 Commercial" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => { toast.success("Purchase order created and sent for approval"); setOpen(false); }}>Create PO</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total POs (June)", value: PURCHASE_ORDERS.length, icon: ShoppingCart },
          { label: "Pending Approval", value: pendingApproval, icon: Clock },
          { label: "In Transit", value: inTransit, icon: Truck },
          { label: "Total PO Value", value: `₹${(totalValue/100000).toFixed(1)}L`, icon: IndianRupee },
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

      <Tabs defaultValue="pos">
        <TabsList>
          <TabsTrigger value="pos">Purchase Orders</TabsTrigger>
          <TabsTrigger value="rfq">RFQ</TabsTrigger>
          <TabsTrigger value="comparison">Supplier Comparison</TabsTrigger>
          <TabsTrigger value="delivery">Delivery Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="pos" className="mt-4">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{["PO No","Supplier","Items","Project","Amount","Delivery","Status","Action"].map(h => <th key={h} className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {PURCHASE_ORDERS.map(po => (
                  <tr key={po.id} className="hover:bg-muted/20">
                    <td className="px-3 py-3 font-mono text-xs font-semibold">{po.id}</td>
                    <td className="px-3 py-3 font-medium text-sm">{po.supplier}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground max-w-[180px] truncate">{po.items}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{po.project}</td>
                    <td className="px-3 py-3 font-semibold text-sm">₹{po.amount.toLocaleString()}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{po.expectedDelivery}</td>
                    <td className="px-3 py-3">
                      <Badge className={
                        po.status === "delivered" ? "bg-green-100 text-green-700 border-green-200" :
                        po.status === "in_transit" ? "bg-blue-100 text-blue-700 border-blue-200" :
                        po.status === "confirmed" ? "bg-purple-100 text-purple-700 border-purple-200" :
                        "bg-amber-100 text-amber-700 border-amber-200"
                      } className="text-xs">{po.status.replace("_"," ")}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      {po.status === "pending_approval" && (
                        <Button size="sm" className="h-6 text-xs" onClick={() => toast.success("PO approved")}>Approve</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="rfq" className="mt-4 space-y-3">
          {RFQS.map(rfq => (
            <Card key={rfq.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">{rfq.id}</span>
                      <Badge className={rfq.status === "open" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-green-100 text-green-700 border-green-200"}>{rfq.status.replace("_"," ")}</Badge>
                    </div>
                    <p className="font-semibold">{rfq.material}</p>
                    <p className="text-sm text-muted-foreground">Qty: {rfq.qty}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {rfq.suppliers.map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className="text-sm font-semibold">{rfq.deadline}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="comparison" className="mt-4">
          {COMPARISONS.map((c, i) => (
            <Card key={i}>
              <CardHeader><CardTitle className="text-sm">{c.rfq} — {c.material}</CardTitle></CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>{["Supplier","Rate/Unit","Delivery","Warranty","Recommended"].map(h => <th key={h} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {c.quotes.map((q, j) => (
                        <tr key={j} className={q.recommended ? "bg-green-50" : "hover:bg-muted/20"}>
                          <td className="px-4 py-3 font-medium">{q.supplier} {q.recommended && <Badge className="ml-1 bg-green-100 text-green-700 border-green-200 text-xs">Best Value</Badge>}</td>
                          <td className="px-4 py-3 font-semibold">₹{q.rate.toLocaleString()}/MT</td>
                          <td className="px-4 py-3 text-muted-foreground">{q.delivery}</td>
                          <td className="px-4 py-3">{q.warranty}</td>
                          <td className="px-4 py-3">{q.recommended ? <CheckCircle className="h-4 w-4 text-green-600" /> : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="delivery" className="mt-4">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{["PO","Supplier","Item","Expected","Actual","Status","QC Passed"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {DELIVERIES.map((d, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{d.po}</td>
                    <td className="px-4 py-3 font-medium">{d.supplier}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{d.item}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{d.expected}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{d.actual}</td>
                    <td className="px-4 py-3">
                      <Badge className={d.status === "delivered" ? "bg-green-100 text-green-700 border-green-200" : d.status === "in_transit" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-600"}>
                        {d.status.replace("_"," ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {d.qcPassed === true ? <CheckCircle className="h-4 w-4 text-green-600" /> : d.qcPassed === false ? <span className="text-red-600 text-xs">Failed</span> : "—"}
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
