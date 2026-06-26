import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Phone, Mail, MapPin, FileText, Building2, IndianRupee, MessageSquare, Search, Edit, Eye } from "lucide-react";
import { PermissionGuard } from "@/components/site/PermissionGuard";

export const Route = createFileRoute("/_authenticated/admin/clients")({
  head: () => ({ meta: [{ title: "Client Management — Operations" }] }),
  component: () => <PermissionGuard module="clients"><ClientManagement /></PermissionGuard>,
});

const MOCK_CLIENTS = [
  { id: "1", name: "Rajesh Kumar Builders", contact: "Rajesh Kumar", phone: "+91-9810001001", email: "rajesh@rkbuilders.in", city: "Greater Noida", projects: 3, totalValue: 4200000, status: "active", type: "corporate", joined: "2022-03-15" },
  { id: "2", name: "Sharma Residency", contact: "Pooja Sharma", phone: "+91-9810002002", email: "pooja.sharma@gmail.com", city: "Noida", projects: 1, totalValue: 1800000, status: "active", type: "individual", joined: "2023-06-01" },
  { id: "3", name: "Green Valley Developers", contact: "Arun Mehta", phone: "+91-9810003003", email: "arun@gvd.co.in", city: "Delhi NCR", projects: 2, totalValue: 7500000, status: "active", type: "corporate", joined: "2021-11-20" },
  { id: "4", name: "Sunita Agarwal", contact: "Sunita Agarwal", phone: "+91-9810004004", email: "sunita.a@yahoo.com", city: "Ghaziabad", projects: 1, totalValue: 950000, status: "completed", type: "individual", joined: "2023-01-10" },
  { id: "5", name: "Metro Infra Pvt Ltd", contact: "Vikash Tiwari", phone: "+91-9810005005", email: "vikash@metroinfra.in", city: "Greater Noida", projects: 4, totalValue: 12000000, status: "active", type: "corporate", joined: "2020-07-08" },
  { id: "6", name: "Patel Family Home", contact: "Ravi Patel", phone: "+91-9810006006", email: "ravi.patel@outlook.com", city: "Noida Extension", projects: 1, totalValue: 2200000, status: "active", type: "individual", joined: "2024-02-14" },
];

const MOCK_CONTRACTS = [
  { id: "C001", client: "Metro Infra Pvt Ltd", project: "Sector 62 Commercial Complex", value: 4500000, startDate: "2024-01-15", endDate: "2024-12-31", status: "active" },
  { id: "C002", client: "Green Valley Developers", project: "Green Valley Residences", value: 3800000, startDate: "2023-08-01", endDate: "2024-08-01", status: "active" },
  { id: "C003", client: "Rajesh Kumar Builders", project: "RK Mall Interior", value: 1200000, startDate: "2024-03-01", endDate: "2024-06-30", status: "completed" },
  { id: "C004", client: "Sharma Residency", project: "3BHK Villa Interior", value: 1800000, startDate: "2023-11-01", endDate: "2024-04-30", status: "completed" },
];

const MOCK_LOGS = [
  { id: "1", client: "Metro Infra Pvt Ltd", type: "call", note: "Discussed Q2 progress, client satisfied. Next meeting on site.", date: "2024-06-15", by: "Operations Manager" },
  { id: "2", client: "Green Valley Developers", type: "email", note: "Sent revised timeline document. Awaiting approval.", date: "2024-06-14", by: "Sales Manager" },
  { id: "3", client: "Rajesh Kumar Builders", type: "meeting", note: "On-site walkthrough completed. Snagging list shared.", date: "2024-06-12", by: "Project Manager" },
  { id: "4", client: "Patel Family Home", type: "call", note: "Initial requirement gathering. Budget ₹22L confirmed.", date: "2024-06-10", by: "Sales Executive" },
];

function ClientManagement() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", contact: "", phone: "", email: "", city: "", type: "individual" });

  const filtered = MOCK_CLIENTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.contact.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = MOCK_CLIENTS.reduce((s, c) => s + c.totalValue, 0);
  const activeClients = MOCK_CLIENTS.filter(c => c.status === "active").length;
  const corporateClients = MOCK_CLIENTS.filter(c => c.type === "corporate").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Client Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage clients, contracts, and communication history</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Client</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add New Client</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Company / Name</Label><Input value={draft.name} onChange={e => setDraft({...draft, name: e.target.value})} placeholder="Metro Infra Pvt Ltd" /></div>
                <div className="space-y-1"><Label>Contact Person</Label><Input value={draft.contact} onChange={e => setDraft({...draft, contact: e.target.value})} placeholder="Vikash Tiwari" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Phone</Label><Input value={draft.phone} onChange={e => setDraft({...draft, phone: e.target.value})} placeholder="+91-98..." /></div>
                <div className="space-y-1"><Label>Email</Label><Input value={draft.email} onChange={e => setDraft({...draft, email: e.target.value})} placeholder="client@email.com" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>City</Label><Input value={draft.city} onChange={e => setDraft({...draft, city: e.target.value})} placeholder="Greater Noida" /></div>
                <div className="space-y-1"><Label>Type</Label>
                  <Select value={draft.type} onValueChange={v => setDraft({...draft, type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => { toast.success("Client added successfully"); setOpen(false); }}>Add Client</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Clients", value: MOCK_CLIENTS.length, icon: Building2, color: "text-blue-600" },
          { label: "Active Clients", value: activeClients, icon: Building2, color: "text-green-600" },
          { label: "Corporate", value: corporateClients, icon: Building2, color: "text-purple-600" },
          { label: "Total Revenue", value: `₹${(totalRevenue/100000).toFixed(1)}L`, icon: IndianRupee, color: "text-gold" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                </div>
                <s.icon className={`h-8 w-8 ${s.color} opacity-20`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="clients">
        <TabsList>
          <TabsTrigger value="clients">All Clients</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="communication">Communication Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  {["Client","Contact","City","Projects","Total Value","Type","Status",""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-muted-foreground">{c.contact}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{c.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground"><MapPin className="inline h-3 w-3 mr-1" />{c.city}</td>
                    <td className="px-4 py-3 text-center font-semibold">{c.projects}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">₹{(c.totalValue/100000).toFixed(1)}L</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-xs capitalize">{c.type}</Badge></td>
                    <td className="px-4 py-3">
                      <Badge className={c.status === "active" ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-600"}>
                        {c.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="contracts" className="mt-4">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{["Contract ID","Client","Project","Value","Start","End","Status"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MOCK_CONTRACTS.map(c => (
                  <tr key={c.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{c.id}</td>
                    <td className="px-4 py-3 font-medium">{c.client}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.project}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">₹{(c.value/100000).toFixed(1)}L</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{c.startDate}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{c.endDate}</td>
                    <td className="px-4 py-3">
                      <Badge className={c.status === "active" ? "bg-green-100 text-green-700 border-green-200" : "bg-blue-100 text-blue-700 border-blue-200"}>
                        {c.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="communication" className="mt-4 space-y-3">
          {MOCK_LOGS.map(log => (
            <Card key={log.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-full p-1.5 ${log.type === "call" ? "bg-green-100" : log.type === "email" ? "bg-blue-100" : "bg-purple-100"}`}>
                      {log.type === "call" ? <Phone className="h-3 w-3 text-green-600" /> : log.type === "email" ? <Mail className="h-3 w-3 text-blue-600" /> : <MessageSquare className="h-3 w-3 text-purple-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{log.client}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{log.note}</p>
                      <p className="text-xs text-muted-foreground mt-1">By {log.by}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{log.date}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
