import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Settings, Database, Mail, Bell, Shield, Download, RefreshCw, Server, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { PermissionGuard } from "@/components/PermissionGuard";
import { getStoredToken } from "@/integrations/auth/client";
import { getMe } from "@/lib/auth.functions";

export const Route = createFileRoute("/_authenticated/admin/system")({
  head: () => ({ meta: [{ title: "System Settings — Operations" }] }),
  beforeLoad: async () => {
    const token = getStoredToken();
    if (!token) throw redirect({ to: "/auth" });
    const me = await getMe();
    if (!me) throw redirect({ to: "/auth" });
    if (!(me.roles ?? []).includes("owner")) throw redirect({ to: "/admin" });
  },
  component: () => <PermissionGuard module="system"><SystemAdmin /></PermissionGuard>,
});

const BACKUPS = [
  { id: "BK001", type: "Full Backup", date: "2024-06-18 02:00", size: "2.4 GB", status: "success", storage: "Replit Cloud" },
  { id: "BK002", type: "Full Backup", date: "2024-06-17 02:00", size: "2.3 GB", status: "success", storage: "Replit Cloud" },
  { id: "BK003", type: "Full Backup", date: "2024-06-16 02:00", size: "2.3 GB", status: "success", storage: "Replit Cloud" },
  { id: "BK004", type: "Full Backup", date: "2024-06-15 02:00", size: "2.2 GB", status: "success", storage: "Replit Cloud" },
  { id: "BK005", type: "Full Backup", date: "2024-06-14 02:00", size: "2.2 GB", status: "failed", storage: "Replit Cloud" },
];

const SYSTEM_STATUS = [
  { service: "Web Application", status: "operational", uptime: "99.98%", responseTime: "124ms" },
  { service: "Database (PostgreSQL)", status: "operational", uptime: "99.99%", responseTime: "45ms" },
  { service: "Authentication Service", status: "operational", uptime: "100%", responseTime: "89ms" },
  { service: "Email Notifications", status: "operational", uptime: "99.95%", responseTime: "250ms" },
  { service: "File Storage", status: "operational", uptime: "99.97%", responseTime: "180ms" },
  { service: "AI Features (OpenAI)", status: "operational", uptime: "99.90%", responseTime: "850ms" },
];

const EMAIL_EVENTS = [
  { event: "New Lead", recipients: "Sales Manager, Operations Manager", enabled: true },
  { event: "Quote Request", recipients: "Sales Manager", enabled: true },
  { event: "Support Ticket Raised", recipients: "Customer Support", enabled: true },
  { event: "Leave Approved/Rejected", recipients: "Employee", enabled: true },
  { event: "Invoice Due Reminder", recipients: "Accountant, Operations Manager", enabled: true },
  { event: "Low Stock Alert", recipients: "Procurement Officer, Operations Manager", enabled: true },
  { event: "Safety Incident Reported", recipients: "Operations Manager, Owner", enabled: true },
  { event: "Daily Site Report", recipients: "Operations Manager, Project Managers", enabled: false },
];

function SystemAdmin() {
  const [emailConfig, setEmailConfig] = useState({ host: "smtp.gmail.com", port: "587", from: "noreply@adityaconstruction.com", tls: true });
  const [notifSettings, setNotifSettings] = useState({ emailEnabled: true, inAppEnabled: true, dailyDigest: false, urgentAlerts: true });
  const [companySettings, setCompanySettings] = useState({ name: "Aditya Constructions", gst: "09AAACA0000A1Z0", pan: "AAACA0000A", address: "Plot No. 5, Sector Alpha-1, Greater Noida, UP – 201310", phone: "+91-9000000001", email: "info@adityaconstruction.com" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">System Administration</h1>
          <p className="text-sm text-muted-foreground mt-1">System settings, backups, email config, notifications, and access control</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {SYSTEM_STATUS.slice(0,3).map(s => (
          <Card key={s.service}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium">{s.service}</p>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Operational</Badge>
                <span className="text-xs text-muted-foreground">{s.uptime} uptime</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="general"><Settings className="h-3.5 w-3.5 mr-1" />General</TabsTrigger>
          <TabsTrigger value="backup"><Database className="h-3.5 w-3.5 mr-1" />Backup</TabsTrigger>
          <TabsTrigger value="email"><Mail className="h-3.5 w-3.5 mr-1" />Email Config</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-3.5 w-3.5 mr-1" />Notifications</TabsTrigger>
          <TabsTrigger value="status"><Server className="h-3.5 w-3.5 mr-1" />System Status</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Company Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Company Name</Label><Input value={companySettings.name} onChange={e => setCompanySettings({...companySettings, name: e.target.value})} /></div>
                <div className="space-y-1"><Label>GST Number</Label><Input value={companySettings.gst} onChange={e => setCompanySettings({...companySettings, gst: e.target.value})} /></div>
                <div className="space-y-1"><Label>PAN Number</Label><Input value={companySettings.pan} onChange={e => setCompanySettings({...companySettings, pan: e.target.value})} /></div>
                <div className="space-y-1"><Label>Phone</Label><Input value={companySettings.phone} onChange={e => setCompanySettings({...companySettings, phone: e.target.value})} /></div>
                <div className="space-y-1"><Label>Email</Label><Input value={companySettings.email} onChange={e => setCompanySettings({...companySettings, email: e.target.value})} /></div>
              </div>
              <div className="space-y-1"><Label>Registered Address</Label><Input value={companySettings.address} onChange={e => setCompanySettings({...companySettings, address: e.target.value})} /></div>
              <div className="flex justify-end">
                <Button onClick={() => toast.success("Company settings saved")}>Save Settings</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle className="text-sm">System Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Default Currency</Label>
                  <Select defaultValue="inr"><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="inr">₹ Indian Rupee (INR)</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Date Format</Label>
                  <Select defaultValue="dd_mm_yyyy"><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd_mm_yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="mm_dd_yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="yyyy_mm_dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Timezone</Label>
                  <Select defaultValue="ist"><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="ist">Asia/Kolkata (IST +5:30)</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Language</Label>
                  <Select defaultValue="en"><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="hi">Hindi</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => toast.success("Preferences saved")}>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Automated Backups</p>
              <p className="text-xs text-muted-foreground">Daily backups at 02:00 AM IST — stored in Replit PostgreSQL cloud</p>
            </div>
            <Button onClick={() => toast.success("Manual backup started…")}><RefreshCw className="h-4 w-4 mr-2" />Backup Now</Button>
          </div>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{["Backup ID","Type","Date & Time","Size","Storage","Status","Action"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {BACKUPS.map(b => (
                  <tr key={b.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs">{b.id}</td>
                    <td className="px-4 py-3 text-sm">{b.type}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{b.date}</td>
                    <td className="px-4 py-3 text-xs">{b.size}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{b.storage}</td>
                    <td className="px-4 py-3">
                      <Badge className={b.status === "success" ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-600 border-red-200"}>{b.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toast.success("Download started")}><Download className="h-3 w-3 mr-1" />Download</Button>
                        {b.status === "success" && <Button size="sm" variant="ghost" className="h-7 text-xs text-amber-600" onClick={() => toast.warning("Restore initiated — server will restart")}><RefreshCw className="h-3 w-3 mr-1" />Restore</Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="email" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">SMTP Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>SMTP Host</Label><Input value={emailConfig.host} onChange={e => setEmailConfig({...emailConfig, host: e.target.value})} /></div>
                <div className="space-y-1"><Label>Port</Label><Input value={emailConfig.port} onChange={e => setEmailConfig({...emailConfig, port: e.target.value})} /></div>
                <div className="space-y-1"><Label>From Address</Label><Input value={emailConfig.from} onChange={e => setEmailConfig({...emailConfig, from: e.target.value})} /></div>
                <div className="space-y-1"><Label>SMTP Password</Label><Input type="password" placeholder="••••••••" /></div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={emailConfig.tls} onCheckedChange={v => setEmailConfig({...emailConfig, tls: v})} />
                <Label>Enable TLS/SSL</Label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => toast.info("Test email sent to owner@adityaconstruction.com")}>Send Test Email</Button>
                <Button onClick={() => toast.success("Email configuration saved")}>Save Config</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle className="text-sm">Notification Events</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {EMAIL_EVENTS.map((e, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{e.event}</p>
                      <p className="text-xs text-muted-foreground">To: {e.recipients}</p>
                    </div>
                    <Switch checked={e.enabled} onCheckedChange={() => toast.success(`${e.event} notifications ${e.enabled ? "disabled" : "enabled"}`)} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Notification Channels</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Email Notifications", desc: "Send email alerts for important events", key: "emailEnabled" as const },
                { label: "In-App Notifications", desc: "Show notifications inside the portal", key: "inAppEnabled" as const },
                { label: "Daily Digest Email", desc: "Send daily summary at 7:00 AM", key: "dailyDigest" as const },
                { label: "Urgent Alerts (Incidents/Safety)", desc: "Immediate alert for critical events regardless of other settings", key: "urgentAlerts" as const },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifSettings[item.key]}
                    onCheckedChange={v => setNotifSettings({...notifSettings, [item.key]: v})}
                  />
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <Button onClick={() => toast.success("Notification settings saved")}>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="mt-4">
          <div className="space-y-3">
            {SYSTEM_STATUS.map((s, i) => (
              <Card key={i}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                      <div>
                        <p className="font-medium text-sm">{s.service}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Uptime: <span className="text-green-600 font-semibold">{s.uptime}</span></span>
                          <span>Response: {s.responseTime}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Operational</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="mt-4 border-green-200 bg-green-50">
            <CardContent className="pt-4 pb-4 flex items-center gap-3 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <div>
                <p className="font-semibold text-sm">All Systems Operational</p>
                <p className="text-xs text-green-600">Last checked: June 18, 2026 at 9:43 AM IST</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
