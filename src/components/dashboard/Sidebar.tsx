"use client";
import Link from "next/link";
import {
  Home,
  Clock,
  Wallet,
  CreditCard,
  Settings,
  HelpCircle,
  Menu,
  X,
  Mail,
  MessageCircle,
  Sun,
  Moon,
  ChevronDown,
} from "lucide-react";
import { ReactNode, useState } from "react";
import { useTheme } from "@/lib/useTheme";

type PageComponent =
  | "overview"
  | "transactions"
  | "wallets"
  | "support-whatsapp"
  | "support-email";

interface SidebarProps {
  onPageChange: (page: PageComponent) => void;
  currentPage: PageComponent;
}

interface SidebarLinkProps {
  icon: ReactNode;
  label: string;
  children?: ReactNode;
  active?: boolean;
  badge?: string;
  onClick?: () => void;
  pageName?: PageComponent;
  subMenu?: boolean;
}

interface SubLinkProps {
  label: string;
  active?: boolean;
  badge?: string;
  onClick?: () => void;
  pageName?: PageComponent;
  icon?: ReactNode;
  status?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onPageChange, currentPage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const { theme, toggle: toggleTheme, mounted } = useTheme();

  const toggleSidebar = () => setIsOpen(!isOpen);

  const toggleMenu = (menu: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menu) ? [] : [menu]
    );
  };


  const handlePageChange = (page: PageComponent) => {
    onPageChange(page);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      {!isOpen && (
        <button
          onClick={toggleSidebar}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl hover:bg-[var(--ep-accent-muted)] transition-colors"
        >
          <Menu size={24} className="text-[var(--ep-heading)]" />
        </button>
      )}

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
          onClick={toggleSidebar}
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
          {/* Logo and Close Button Container */}
          <div className="h-16 px-6 border-b border-[var(--ep-border)] flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-[var(--ep-accent)] flex items-center justify-center shadow-[0_2px_8px_rgba(67,57,202,0.25)]">
                <div className="w-4 h-4 rounded-md bg-white"></div>
              </div>
              <span className="text-lg font-bold tracking-tight text-[var(--ep-heading)]">
                ElementPay
              </span>
            </Link>
            {isOpen && (
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-1.5 hover:bg-[var(--ep-accent-muted)] rounded-xl transition-colors"
              >
                <X size={20} className="text-[var(--ep-heading)]" />
              </button>
            )}
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
                pageName="overview"
              >
                {expandedMenus.includes("home") && (
                  <div className="ml-4 space-y-0.5 mt-0.5">
                    <SubLink
                      label="Overview"
                      active={currentPage === "overview"}
                      onClick={() => handlePageChange("overview")}
                      pageName="overview"
                    />
                     
                  </div>
                )}
              </SidebarLink>
              <SidebarLink
                icon={<Clock size={20} />}
                label="Transactions"
                active={currentPage === "transactions"}
                onClick={() => handlePageChange("transactions")}
                pageName="transactions"
              />
            </div>

            {/* Support and Settings Section */}
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
                          <MessageCircle size={16} className="text-emerald-500" />
                        }
                        label="WhatsApp"
                        active={currentPage === "support-whatsapp"}
                        onClick={() => handlePageChange("support-whatsapp")}
                        status="Online"
                      />
                      <SubLink
                        icon={<Mail size={16} className="text-[var(--ep-muted)]" />}
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

          {/* Theme Toggle Footer */}
          <div className="p-4 border-t border-[var(--ep-border)]">
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
      </aside>
    </>
  );
};

// SidebarLink Component
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
      <span className={active ? "text-[var(--ep-accent)]" : "text-[var(--ep-muted)]"}>
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
            active ? "rotate-0 text-[var(--ep-accent)]" : "-rotate-90 text-[var(--ep-muted)]"
          }`}
        />
      )}
    </button>
    {children}
  </div>
);

// SubLink Component
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
      <span className="ml-auto text-xs text-emerald-500 font-medium px-2">{status}</span>
    )}
    {badge && (
      <span className="ml-auto bg-[var(--ep-accent-muted)] text-[var(--ep-accent)] px-2 py-0.5 rounded-full text-xs font-medium">
        {badge}
      </span>
    )}
  </button>
);

export default Sidebar;
