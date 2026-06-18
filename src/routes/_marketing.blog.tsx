import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_marketing/blog")({
  component: () => <Outlet />,
});
