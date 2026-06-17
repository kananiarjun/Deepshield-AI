"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Shield, 
  BarChart3, 
  Settings,
  ShieldCheck,
  Activity,
  History,
  Lock,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";

const sidebarNavigation = [
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Portfolio", href: "/portfolio", icon: ShieldCheck },
  { name: "Asset Safety", href: "/#", icon: Lock },
  { name: "Network Health", href: "/#", icon: Activity },
  { name: "Audit Logs", href: "/#", icon: History },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, setSidebarOpen } = useStore();

  // Hide sidebar on the landing page based on typical SaaS layouts
  if (pathname === "/") return null;

  return (
    <>
      {/* Backdrop overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 top-16 bg-black/40 backdrop-blur-sm z-30 transition-opacity duration-300 cursor-pointer"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside 
        className={cn(
          "fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-card border-r border-border flex flex-col z-40 transition-transform duration-300 ease-in-out shadow-xl",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Context Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center border border-primary/20">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Guardian Core</h2>
              <p className="text-xs text-muted-foreground">AI-Powered Protection</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
            aria-label="Close Menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {sidebarNavigation.map((item) => {
            const isActive = pathname === item.href || (item.name === "Asset Safety" && pathname === "/settings");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <Button 
            variant="outline" 
            onClick={() => setSidebarOpen(false)}
            className="w-full justify-center bg-transparent border-border text-foreground hover:bg-secondary font-bold"
          >
            Upgrade Node
          </Button>
        </div>
      </aside>
    </>
  );
}
