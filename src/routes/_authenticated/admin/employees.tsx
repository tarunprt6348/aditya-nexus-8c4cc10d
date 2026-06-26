import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Search, Users, UserCheck, Clock, TrendingUp, Download, Filter } from "lucide-react";
import { ROLE_LABELS } from "@/lib/roles";
import { PermissionGuard } from "@/components/site/PermissionGuard";

export const Route = createFileRoute("/_authenticated/admin/employees")({
  head: () => ({ meta: [{ title: "Employees — Operations" }] }),
  component: () => <PermissionGuard module="employees"><EmployeeManagement /></PermissionGuard>,
});

const ATTENDANCE = [
  { name: "Rahul Sharma", role: "hr_manager", date: "2024-06-18", in: "09:02", out: "18:15", status: "present" },
  { name: "Priya Gupta", role: "project_manager", date: "2024-06-18", in: "08:55", out: "18:30", status: "present" },
  { name: "Amit Singh", role: "site_engineer", date: "2024-06-18", in: "07:30", out: "17:00", status: "present" },
  { name: "Neha Verma", role: "sales_executive", date: "2024-06-18", in: "--", out: "--", status: "leave" },
  { name: "Deepak Joshi", role: "sales_manager", date: "2024-06-18", in: "09:45", out: "--", status: "present" },
  { name: "Kavya Nair", role: "customer_support", date: "2024-06-18", in: "--", out: "--", status: "absent" },
  { name: "Arjun Mehta", role: "accountant", date: "2024-06-18", in: "09:10", out: "18:05", status: "present" },
  { name: "Pooja Sharma", role: "marketing_manager", date: "2024-06-18", in: "10:00", out: "19:00", status: "present" },
  { name: "Rohit Agarwal", role: "site_engineer", date: "2024-06-18", in: "07:45", out: "--", status: "present" },
  { name: "Sanjay Tiwari", role: "project_manager", date: "2024-06-18", in: "08:30", out: "17:30", status: "present" },
];

const PERFORMANCE = [
  { name: "Priya Gupta", role: "Project Manager", score: 92, tasks: 28, onTime: 26, rating: "Excellent" },
  { name: "Deepak Joshi", role: "Sales Manager", score: 88, tasks: 35, onTime: 31, rating: "Good" },
  { name: "Rahul Sharma", role: "HR Manager", score: 85, tasks: 20, onTime: 17, rating: "Good" },
  { name: "Amit Singh", role: "Site Engineer", score: 90, tasks: 42, onTime: 38, rating: "Excellent" },
  { name: "Arjun Mehta", role: "Accountant", score: 82, tasks: 18, onTime: 15, rating: "Good" },
  { name: "Pooja Sharma", role: "Marketing Manager", score: 79, tasks: 22, onTime: 17, rating: "Average" },
];

const SKILLS = [
  { name: "Priya Gupta", skills: ["AutoCAD", "MS Project", "RERA Compliance", "Budget Management"] },
  { name: "Amit Singh", skills: ["Structural Analysis", "AutoCAD", "Site Survey", "RCC Design"] },
  { name: "Rohit Agarwal", skills: ["Civil Engineering", "Quantity Survey", "AutoCAD"] },
  { name: "Deepak Joshi", skills: ["CRM", "Negotiation", "Real Estate Law", "Lead Generation"] },
  { name: "Arjun Mehta", skills: ["Tally ERP", "GST Filing", "Payroll", "Financial Analysis"] },
];

function EmployeeManagement() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const ids = (roles ?? []).map((r: any) => r.user_id);
      const { data: profs } = await supabase.from("profiles").select("id, full_name, phone").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
      const merged = (profs ?? []).map((p: any) => ({
        ...p,
        role: (roles ?? []).find((r: any) => r.user_id === p.id)?.role ?? "staff",
      }));
      setEmployees(merged);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = employees.filter(e =>
    (e.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase())
  );

  const presentToday = ATTENDANCE.filter(a => a.status === "present").length;
  const onLeave = ATTENDANCE.filter(a => a.status === "leave").length;
  const absent = ATTENDANCE.filter(a => a.status === "absent").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Employee Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Attendance, performance, skills, and records</p>
        </div>
        <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Employees", value: employees.length || 17, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Present Today", value: presentToday, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
          { label: "On Leave", value: onLeave, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Absent", value: absent, icon: Users, color: "text-red-500", bg: "bg-red-50" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                </div>
                <div className={`rounded-lg p-2 ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="directory">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="directory">Directory</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading employees…</p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>{["Name","Role","Phone","Department","Status"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(e => (
                    <tr key={e.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{e.full_name ?? "—"}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{ROLE_LABELS[e.role as keyof typeof ROLE_LABELS] ?? e.role}</Badge></td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{e.phone ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">Operations</td>
                      <td className="px-4 py-3"><Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Active</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-sm font-medium">Today — June 18, 2026</p>
          </div>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{["Employee","Role","Check In","Check Out","Status"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ATTENDANCE.map((a, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{a.name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{ROLE_LABELS[a.role as keyof typeof ROLE_LABELS] ?? a.role}</td>
                    <td className="px-4 py-3 font-mono text-sm">{a.in}</td>
                    <td className="px-4 py-3 font-mono text-sm">{a.out}</td>
                    <td className="px-4 py-3">
                      <Badge className={a.status === "present" ? "bg-green-100 text-green-700 border-green-200" : a.status === "leave" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-red-100 text-red-600 border-red-200"}>
                        {a.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-4 space-y-3">
          {PERFORMANCE.map((p, i) => (
            <Card key={i}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.role}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Tasks On-Time</p>
                      <p className="font-semibold text-sm">{p.onTime}/{p.tasks}</p>
                    </div>
                    <Badge className={p.rating === "Excellent" ? "bg-green-100 text-green-700 border-green-200" : p.rating === "Good" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-amber-100 text-amber-700 border-amber-200"}>
                      {p.rating}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={p.score} className="flex-1 h-2" />
                  <span className="text-sm font-bold w-10 text-right">{p.score}%</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="skills" className="mt-4 space-y-3">
          {SKILLS.map((s, i) => (
            <Card key={i}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{s.name}</p>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {s.skills.map(sk => <Badge key={sk} variant="outline" className="text-xs">{sk}</Badge>)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
