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
import { Plus, Star, Truck, Package, IndianRupee, Phone, MapPin, Search, TrendingUp } from "lucide-react";
import { PermissionGuard } from "@/components/site/PermissionGuard";

export const Route = createFileRoute("/_authenticated/admin/vendors")({
  head: () => ({ meta: [{ title: "Contractors & Vendors — Operations" }] }),
  component: () => <PermissionGuard module="vendors"><VendorManagement /></PermissionGuard>,
});

const VENDORS = [
  { id: "V001", name: "Buildex Materials Pvt Ltd", type: "supplier", category: "Cement & Steel", contact: "Mukesh Yadav", phone: "+91-9811100001", city: "Delhi", rating: 4.5, orders: 18, totalValue: 3200000, status: "active", paymentTerms: "30 days" },
  { id: "V002", name: "Ram Construction Contractor", type: "contractor", category: "Civil Work", contact: "Ram Singh", phone: "+91-9811100002", city: "Greater Noida", rating: 4.2, orders: 7, totalValue: 5800000, status: "active", paymentTerms: "Milestone" },
  { id: "V003", name: "Elite Interiors Contractor", type: "contractor", category: "Interior Fit-out", contact: "Anuj Kumar", phone: "+91-9811100003", city: "Noida", rating: 4.8, orders: 5, totalValue: 2400000, status: "active", paymentTerms: "Milestone" },
  { id: "V004", name: "SafeElec Pvt Ltd", type: "supplier", category: "Electrical Materials", contact: "Suresh Gupta", phone: "+91-9811100004", city: "Ghaziabad", rating: 3.9, orders: 12, totalValue: 850000, status: "active", paymentTerms: "15 days" },
  { id: "V005", name: "AquaPlumb Solutions", type: "contractor", category: "Plumbing & Sanitary", contact: "Dinesh Patel", phone: "+91-9811100005", city: "Greater Noida", rating: 4.1, orders: 9, totalValue: 1200000, status: "active", paymentTerms: "Per stage" },
  { id: "V006", name: "GreenPaint Supplies", type: "supplier", category: "Paint & Finishes", contact: "Kavita Sharma", phone: "+91-9811100006", city: "Delhi", rating: 4.3, orders: 24, totalValue: 620000, status: "inactive", paymentTerms: "COD" },
];

const PAYMENTS = [
  { vendor: "Buildex Materials Pvt Ltd", invoice: "INV-2024-081", amount: 485000, dueDate: "2024-07-15", status: "pending" },
  { vendor: "Ram Construction Contractor", invoice: "INV-2024-077", amount: 1200000, dueDate: "2024-06-30", status: "overdue" },
  { vendor: "Elite Interiors Contractor", invoice: "INV-2024-079", amount: 680000, dueDate: "2024-07-20", status: "pending" },
  { vendor: "SafeElec Pvt Ltd", invoice: "INV-2024-074", amount: 125000, dueDate: "2024-06-10", status: "paid" },
  { vendor: "AquaPlumb Solutions", invoice: "INV-2024-076", amount: 320000, dueDate: "2024-06-25", status: "paid" },
];

const CONTRACTS = [
  { vendor: "Ram Construction Contractor", project: "Sector 62 Commercial", value: 3800000, start: "2024-01-15", end: "2024-12-31", status: "active" },
  { vendor: "Elite Interiors Contractor", project: "Green Valley Apartments Interior", value: 1800000, start: "2024-03-01", end: "2024-08-31", status: "active" },
  { vendor: "AquaPlumb Solutions", project: "Township Phase 2", value: 950000, start: "2024-02-01", end: "2024-09-30", status: "active" },
  { vendor: "Buildex Materials Pvt Ltd", project: "Annual Supply Contract", value: 2500000, start: "2024-01-01", end: "2024-12-31", status: "active" },
];

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`h-3 w-3 ${i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
      ))}
      <span className="ml-1 text-xs font-semibold">{value.toFixed(1)}</span>
    </div>
  );
}

function VendorManagement() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [open, setOpen] = useState(false);

  const filtered = VENDORS.filter(v =>
    (tab === "all" || v.type === tab) &&
    (v.name.toLowerCase().includes(search.toLowerCase()) || v.category.toLowerCase().includes(search.toLowerCase()))
  );

  const totalVendors = VENDORS.filter(v => v.type === "supplier").length;
  const totalContractors = VENDORS.filter(v => v.type === "contractor").length;
  const totalSpend = VENDORS.reduce((s, v) => s + v.totalValue, 0);
  const overdue = PAYMENTS.filter(p => p.status === "overdue").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Contractors & Vendors</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage suppliers, contractors, contracts, and payments</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Vendor</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Register Vendor / Contractor</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Company Name</Label><Input placeholder="Buildex Materials" /></div>
                <div className="space-y-1"><Label>Type</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent><SelectItem value="supplier">Supplier</SelectItem><SelectItem value="contractor">Contractor</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Category</Label><Input placeholder="Cement & Steel" /></div>
                <div className="space-y-1"><Label>Contact Person</Label><Input placeholder="Name" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Phone</Label><Input placeholder="+91-98..." /></div>
                <div className="space-y-1"><Label>City</Label><Input placeholder="Greater Noida" /></div>
              </div>
              <div className="space-y-1"><Label>Payment Terms</Label><Input placeholder="30 days / COD / Milestone" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => { toast.success("Vendor registered successfully"); setOpen(false); }}>Register</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Suppliers", value: totalVendors, icon: Package, color: "text-blue-600" },
          { label: "Contractors", value: totalContractors, icon: Truck, color: "text-purple-600" },
          { label: "Total Spend", value: `₹${(totalSpend/100000).toFixed(0)}L`, icon: IndianRupee, color: "text-gold" },
          { label: "Overdue Payments", value: overdue, icon: IndianRupee, color: "text-red-500" },
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

      <Tabs defaultValue="vendors">
        <TabsList>
          <TabsTrigger value="vendors">Vendors & Contractors</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="vendors" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={tab} onValueChange={setTab}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="supplier">Suppliers</SelectItem>
                <SelectItem value="contractor">Contractors</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3">
            {filtered.map(v => (
              <Card key={v.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{v.name}</span>
                        <Badge variant="outline" className={`text-xs ${v.type === "supplier" ? "border-blue-300 text-blue-600" : "border-purple-300 text-purple-600"}`}>{v.type}</Badge>
                        <Badge variant="outline" className="text-xs">{v.category}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{v.contact} · {v.phone}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{v.city}</span>
                        <span>Payment: {v.paymentTerms}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <StarRating value={v.rating} />
                      <p className="text-xs text-muted-foreground">{v.orders} orders · ₹{(v.totalValue/100000).toFixed(1)}L</p>
                      <Badge className={v.status === "active" ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-600"}>{v.status}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="contracts" className="mt-4">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{["Vendor/Contractor","Project","Contract Value","Start","End","Status"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {CONTRACTS.map((c, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{c.vendor}</td>
                    <td className="px-4 py-3 text-muted-foreground text-sm">{c.project}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">₹{(c.value/100000).toFixed(1)}L</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.start}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.end}</td>
                    <td className="px-4 py-3"><Badge className="bg-green-100 text-green-700 border-green-200 text-xs">{c.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{["Vendor","Invoice","Amount","Due Date","Status","Action"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {PAYMENTS.map((p, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{p.vendor}</td>
                    <td className="px-4 py-3 font-mono text-xs">{p.invoice}</td>
                    <td className="px-4 py-3 font-semibold">₹{p.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{p.dueDate}</td>
                    <td className="px-4 py-3">
                      <Badge className={p.status === "paid" ? "bg-green-100 text-green-700 border-green-200" : p.status === "overdue" ? "bg-red-100 text-red-600 border-red-200" : "bg-amber-100 text-amber-700 border-amber-200"}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {p.status !== "paid" && <Button size="sm" variant="outline" onClick={() => toast.success("Payment marked as paid")}>Mark Paid</Button>}
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
