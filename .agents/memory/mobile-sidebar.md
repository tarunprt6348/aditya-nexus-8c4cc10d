---
name: Mobile sidebar pattern
description: How the admin/staff sidebar handles mobile responsiveness with hamburger toggle
---

## The rule
`AdminSidebar` accepts an optional `onNavigate?: () => void` prop. When provided, every nav `<Link>` and the logo link calls it on click — this lets the parent layout close the mobile drawer after navigation.

**Route layout pattern** (both `admin/route.tsx` and `staff/route.tsx`):
- State: `const [sidebarOpen, setSidebarOpen] = useState(false)`
- Mobile top bar (visible only on `< md`): hamburger/X button toggles `sidebarOpen`
- Dark overlay `div`: `fixed inset-0 z-30 bg-black/40 md:hidden`, closes on click
- Sidebar wrapper: `fixed inset-y-0 left-0 z-40 … md:static md:translate-x-0`, translate-x-0 when open, -translate-x-full when closed
- Pass `onNavigate={() => setSidebarOpen(false)}` to `<AdminSidebar>`

**Why:** The sidebar was `hidden md:flex` with no mobile access. Admin-area users on phones had no way to navigate.
