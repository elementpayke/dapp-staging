"use client";
import Link from "next/link";
import {
  Home,
  Clock,
  HelpCircle,
  X,
  Mail,
  MessageCircle,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { ReactNode, useState } from "react";
import { useTheme } from "@/lib/useTheme";

type PageComponent =
  | "overview"
  | "transactions"
  | "wallets"
  | "profile"
  | "support-whatsapp"
  | "support-email";

interface SidebarProps {
  onPageChange: (page: PageComponent) => void;
  currentPage: PageComponent;
  /** Controlled open state — driven by Dashboard header hamburger */
  isOpen: boolean;
  /** Called when sidebar should close (overlay click, close btn, nav item) */
  onClose: () => void;
  /** Current user — shown in the sidebar footer on mobile */
  user?: { email?: string; firstName?: string } | null;
  /** Logout handler — wired up to the sidebar footer on mobile */
  onLogout?: () => void;
}

interface SidebarLinkProps {
  icon: ReactNode;
  label: string;
  children?: ReactNode;
  active?: boolean;
  badge?: string;
  onClick?: () => void;
  subMenu?: boolean;
}

interface SubLinkProps {
  label: string;
  active?: boolean;
  badge?: string;
  onClick?: () => void;
  icon?: ReactNode;
  status?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  onPageChange,
  currentPage,
  isOpen,
  onClose,
  user,
  onLogout,
}) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const { theme, toggle: toggleTheme, mounted } = useTheme();

  const toggleMenu = (menu: string) => {
    setExpandedMenus((prev) => (prev.includes(menu) ? [] : [menu]));
  };

  const handlePageChange = (page: PageComponent) => {
    onPageChange(page);
    onClose();
  };

  const getAvatarInitial = (email: string | undefined) => {
    if (!email) return "?";
    return email[0].toUpperCase();
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-[var(--ep-bg-card)] border-r border-[var(--ep-border)] z-40
          w-64 transform transition-transform duration-200 ease-in-out
          lg:transform-none
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo and Close Button */}
          <div className="h-16 px-6 border-b border-[var(--ep-border)] flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-[var(--ep-accent)] flex items-center justify-center shadow-[0_2px_8px_rgba(67,57,202,0.25)]">
                <div className="w-4 h-4 rounded-md bg-white"></div>
              </div>
              <span className="text-lg font-bold tracking-tight text-[var(--ep-heading)]">
                ElementPay
              </span>
            </Link>

            {/* Close button — large tap target for mobile */}
            <button
              onClick={onClose}
              className="lg:hidden flex items-center justify-center w-10 h-10 hover:bg-[var(--ep-accent-muted)] rounded-xl transition-colors"
              aria-label="Close menu"
            >
              <X size={22} className="text-[var(--ep-heading)]" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ep-muted)] mb-3 px-3">
              Menu
            </p>
            <div className="space-y-1">
              <SidebarLink
                icon={<Home size={20} />}
                label="Home"
                subMenu={true}
                active={currentPage === "overview"}
                onClick={() => toggleMenu("home")}
              >
                {expandedMenus.includes("home") && (
                  <div className="ml-4 space-y-0.5 mt-0.5">
                    <SubLink
                      label="Overview"
                      active={currentPage === "overview"}
                      onClick={() => handlePageChange("overview")}
                    />
                  </div>
                )}
              </SidebarLink>

              <SidebarLink
                icon={<Clock size={20} />}
                label="Transactions"
                active={currentPage === "transactions"}
                onClick={() => handlePageChange("transactions")}
              />
            </div>

            {/* Support Section */}
            <div className="mt-6 pt-4 border-t border-[var(--ep-border)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ep-muted)] mb-3 px-3">
                Support
              </p>
              <div className="space-y-1">
                <SidebarLink
                  icon={<HelpCircle size={20} />}
                  label="Support"
                  subMenu={true}
                  active={currentPage.startsWith("support")}
                  onClick={() => toggleMenu("support")}
                >
                  {expandedMenus.includes("support") && (
                    <div className="ml-4 space-y-0.5 mt-0.5">
                      <SubLink
                        icon={
                          <MessageCircle
                            size={16}
                            className="text-emerald-500"
                          />
                        }
                        label="WhatsApp"
                        active={currentPage === "support-whatsapp"}
                        onClick={() => handlePageChange("support-whatsapp")}
                        status="Online"
                      />
                      <SubLink
                        icon={
                          <Mail
                            size={16}
                            className="text-[var(--ep-muted)]"
                          />
                        }
                        label="Email"
                        active={currentPage === "support-email"}
                        onClick={() => handlePageChange("support-email")}
                      />
                    </div>
                  )}
                </SidebarLink>
              </div>
            </div>
          </nav>

          {/* ── Footer ─────────────────────────────────────────────── */}
          <div className="border-t border-[var(--ep-border)]">
            {/*
             * User profile row — visible on MOBILE only.
             * On desktop the avatar/logout lives in the Dashboard top-bar.
             */}
            {user && (
              <div className="lg:hidden px-4 py-3 border-b border-[var(--ep-border)]">
                <div className="flex items-center gap-3">
                  {/* Avatar initial */}
                  <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center bg-[var(--ep-accent-muted)] rounded-full text-[var(--ep-accent)] font-semibold text-sm">
                    {getAvatarInitial(user.email)}
                  </div>

                  {/* Email + status */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium text-[var(--ep-heading)] truncate"
                      title={user.email}
                    >
                      {user.email || ""}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      <span className="text-xs text-[var(--ep-muted)]">
                        Signed in
                      </span>
                    </div>
                  </div>

                  {/* Logout icon button */}
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
                      aria-label="Log out"
                    >
                      <LogOut
                        size={18}
                        className="text-[var(--ep-muted)] group-hover:text-red-500 transition-colors"
                      />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Theme toggle */}
            <div className="p-4">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-[var(--ep-accent-subtle)] transition-colors text-[var(--ep-body)]"
              >
                {mounted && theme === "dark" ? (
                  <Sun size={18} className="text-[var(--ep-muted)]" />
                ) : (
                  <Moon size={18} className="text-[var(--ep-muted)]" />
                )}
                <span className="text-sm font-medium">
                  {mounted && theme === "dark" ? "Light Mode" : "Dark Mode"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

// ── SidebarLink ────────────────────────────────────────────────────
const SidebarLink: React.FC<SidebarLinkProps> = ({
  icon,
  label,
  children,
  active,
  badge,
  onClick,
  subMenu,
}) => (
  <div className="space-y-0.5">
    <button
      className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
        active
          ? "bg-[var(--ep-accent-muted)] text-[var(--ep-accent)]"
          : "hover:bg-[var(--ep-accent-subtle)] text-[var(--ep-body)]"
      }`}
      onClick={onClick}
    >
      <span
        className={active ? "text-[var(--ep-accent)]" : "text-[var(--ep-muted)]"}
      >
        {icon}
      </span>
      <span className={`text-sm ${active ? "font-semibold" : "font-medium"}`}>
        {label}
      </span>
      {badge && (
        <span className="ml-auto bg-[var(--ep-accent-muted)] text-[var(--ep-accent)] px-2 py-0.5 rounded-full text-xs font-medium">
          {badge}
        </span>
      )}
      {subMenu && (
        <ChevronDown
          size={16}
          className={`ml-auto transition-transform duration-200 ${
            active
              ? "rotate-0 text-[var(--ep-accent)]"
              : "-rotate-90 text-[var(--ep-muted)]"
          }`}
        />
      )}
    </button>
    {children}
  </div>
);

// ── SubLink ────────────────────────────────────────────────────────
const SubLink: React.FC<SubLinkProps> = ({
  label,
  active,
  badge,
  onClick,
  icon,
  status,
}) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full pl-3 py-2 text-sm rounded-lg transition-colors ${
      active
        ? "text-[var(--ep-accent)] bg-[var(--ep-accent-muted)] font-medium"
        : "text-[var(--ep-body)] hover:bg-[var(--ep-accent-subtle)]"
    }`}
  >
    {icon && <span className="mr-2">{icon}</span>}
    <span>{label}</span>
    {status && (
      <span className="ml-auto text-xs text-emerald-500 font-medium px-2">
        {status}
      </span>
    )}
    {badge && (
      <span className="ml-auto bg-[var(--ep-accent-muted)] text-[var(--ep-accent)] px-2 py-0.5 rounded-full text-xs font-medium">
        {badge}
      </span>
    )}
  </button>
);

export default Sidebar;
