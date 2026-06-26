import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { FolderOpen, FileText, Download, Upload, Search, Eye, Trash2, File, FileBadge, FileCheck, Shield, HardHat, Map } from "lucide-react";
import { PermissionGuard } from "@/components/site/PermissionGuard";

export const Route = createFileRoute("/_authenticated/admin/documents")({
  head: () => ({ meta: [{ title: "Documents — Operations" }] }),
  component: () => <PermissionGuard module="documents"><DocumentManagement /></PermissionGuard>,
});

type DocType = { id: string; name: string; project: string; category: string; size: string; uploadedBy: string; date: string; status: "approved" | "pending" | "draft" };

const DOCS: Record<string, DocType[]> = {
  blueprints: [
    { id: "D001", name: "Sector-62-Ground-Floor-Plan-v3.dwg", project: "Sector 62 Commercial", category: "Blueprint", size: "8.4 MB", uploadedBy: "Priya Gupta", date: "2024-06-10", status: "approved" },
    { id: "D002", name: "Sector-62-Elevation-North-South.dwg", project: "Sector 62 Commercial", category: "Blueprint", size: "6.2 MB", uploadedBy: "Priya Gupta", date: "2024-06-10", status: "approved" },
    { id: "D003", name: "GreenValley-Block-A-FloorPlan.pdf", project: "Green Valley Residences", category: "Blueprint", size: "4.1 MB", uploadedBy: "Sanjay Tiwari", date: "2024-05-25", status: "approved" },
    { id: "D004", name: "Township-Site-Layout-Phase2.pdf", project: "Township Phase 2", category: "Blueprint", size: "12.8 MB", uploadedBy: "Priya Gupta", date: "2024-05-15", status: "pending" },
  ],
  contracts: [
    { id: "D010", name: "Metro-Infra-Contract-2024.pdf", project: "Sector 62 Commercial", category: "Contract", size: "2.2 MB", uploadedBy: "Operations Manager", date: "2024-01-10", status: "approved" },
    { id: "D011", name: "GreenValley-Agreement-Signed.pdf", project: "Green Valley Residences", category: "Contract", size: "1.8 MB", uploadedBy: "Operations Manager", date: "2023-08-01", status: "approved" },
    { id: "D012", name: "Township-Phase2-LOA.pdf", project: "Township Phase 2", category: "Contract", size: "3.1 MB", uploadedBy: "Aditya Owner", date: "2024-01-20", status: "approved" },
    { id: "D013", name: "RamConstruction-Labour-Contract.pdf", project: "All Projects", category: "Contract", size: "1.2 MB", uploadedBy: "HR Manager", date: "2024-02-01", status: "approved" },
  ],
  permits: [
    { id: "D020", name: "Sector62-Building-Permit-GNIDA.pdf", project: "Sector 62 Commercial", category: "Permit", size: "1.5 MB", uploadedBy: "Operations Manager", date: "2023-12-15", status: "approved" },
    { id: "D021", name: "GreenValley-Environmental-Clearance.pdf", project: "Green Valley Residences", category: "Permit", size: "2.8 MB", uploadedBy: "Operations Manager", date: "2023-07-20", status: "approved" },
    { id: "D022", name: "Township-FireNOC-Pending.pdf", project: "Township Phase 2", category: "Permit", size: "0.8 MB", uploadedBy: "Operations Manager", date: "2024-03-10", status: "pending" },
  ],
  safety: [
    { id: "D030", name: "Site-Safety-Manual-v2.pdf", project: "All Projects", category: "Safety", size: "5.2 MB", uploadedBy: "Operations Manager", date: "2024-01-01", status: "approved" },
    { id: "D031", name: "PPE-Policy-Guidelines.pdf", project: "All Projects", category: "Safety", size: "1.1 MB", uploadedBy: "HR Manager", date: "2024-01-15", status: "approved" },
    { id: "D032", name: "Emergency-Evacuation-Plan-Sector62.pdf", project: "Sector 62 Commercial", category: "Safety", size: "0.9 MB", uploadedBy: "Rohit Agarwal", date: "2024-02-01", status: "approved" },
  ],
  inspection: [
    { id: "D040", name: "Sector62-StructuralInspection-June2024.pdf", project: "Sector 62 Commercial", category: "Inspection", size: "3.4 MB", uploadedBy: "Rohit Agarwal", date: "2024-06-15", status: "approved" },
    { id: "D041", name: "GreenValley-QC-Report-Q2.pdf", project: "Green Valley Residences", category: "Inspection", size: "2.1 MB", uploadedBy: "Amit Singh", date: "2024-06-01", status: "approved" },
    { id: "D042", name: "Township-Foundation-Inspection.pdf", project: "Township Phase 2", category: "Inspection", size: "4.8 MB", uploadedBy: "Rohit Agarwal", date: "2024-05-20", status: "pending" },
  ],
  insurance: [
    { id: "D050", name: "Contractor-All-Risk-Policy-2024.pdf", project: "All Projects", category: "Insurance", size: "1.6 MB", uploadedBy: "Aditya Owner", date: "2024-01-01", status: "approved" },
    { id: "D051", name: "Workmen-Compensation-Policy.pdf", project: "All Projects", category: "Insurance", size: "1.3 MB", uploadedBy: "HR Manager", date: "2024-01-01", status: "approved" },
  ],
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  blueprints: Map,
  contracts: FileText,
  permits: FileBadge,
  safety: HardHat,
  inspection: FileCheck,
  insurance: Shield,
};

const CATEGORY_LABELS: Record<string, string> = {
  blueprints: "Blueprints & CAD",
  contracts: "Contracts",
  permits: "Permits & NOCs",
  safety: "Safety Manuals",
  inspection: "Inspection Reports",
  insurance: "Insurance",
};

function DocRow({ doc }: { doc: DocType }) {
  return (
    <tr className="hover:bg-muted/20">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <File className="h-4 w-4 text-blue-500 shrink-0" />
          <span className="text-sm font-medium truncate max-w-[250px]" title={doc.name}>{doc.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{doc.project}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{doc.size}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{doc.uploadedBy}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{doc.date}</td>
      <td className="px-4 py-3">
        <Badge className={doc.status === "approved" ? "bg-green-100 text-green-700 border-green-200 text-xs" : doc.status === "pending" ? "bg-amber-100 text-amber-700 border-amber-200 text-xs" : "bg-gray-100 text-gray-600 text-xs"}>
          {doc.status}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toast.info(`Viewing ${doc.name}`)}><Eye className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toast.success(`Downloading ${doc.name}`)}><Download className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={() => toast.error("Document deleted")}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </td>
    </tr>
  );
}

function DocumentManagement() {
  const [search, setSearch] = useState("");
  const totalDocs = Object.values(DOCS).reduce((s, d) => s + d.length, 0);
  const pending = Object.values(DOCS).flat().filter(d => d.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Document Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Blueprints, contracts, permits, inspection reports, safety manuals, and insurance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Download className="h-4 w-4 mr-2" />Bulk Download</Button>
          <Button onClick={() => toast.info("Upload dialog — connect cloud storage to enable")}><Upload className="h-4 w-4 mr-2" />Upload Document</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Documents", value: totalDocs },
          { label: "Pending Review", value: pending },
          { label: "Categories", value: Object.keys(DOCS).length },
          { label: "Projects Covered", value: 4 },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Tabs defaultValue="blueprints">
        <TabsList className="flex-wrap h-auto gap-1">
          {Object.keys(DOCS).map(cat => {
            const Icon = CATEGORY_ICONS[cat];
            return (
              <TabsTrigger key={cat} value={cat} className="text-xs">
                <Icon className="h-3.5 w-3.5 mr-1" />{CATEGORY_LABELS[cat]}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(DOCS).map(([cat, docs]) => {
          const filtered = docs.filter(d =>
            !search ||
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.project.toLowerCase().includes(search.toLowerCase())
          );
          return (
            <TabsContent key={cat} value={cat} className="mt-4">
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>{["File Name","Project","Size","Uploaded By","Date","Status","Actions"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.length > 0 ? filtered.map(d => <DocRow key={d.id} doc={d} />) : (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No documents found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
