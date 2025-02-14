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
  HandCoinsIcon,
} from "lucide-react";
import { ReactNode, useState } from "react";
import { set } from "react-hook-form";
import Image from "next/image";

type PageComponent =
  | "overview"
  | "transactions"
  | "hakiba"
  | "loans"
  | "credit-score"
  | "wallets"
  | "cards"
  | "settings"
  | "support-whatsapp"
  | "support-email"
  | "referral";

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

  const toggleSidebar = () => setIsOpen(!isOpen);

  const toggleMenu = (menu: string) => {
    setExpandedMenus([]);
    setExpandedMenus((prev) =>
      prev.includes(menu)
        ? prev.filter((item) => item !== menu)
        : [...prev, menu]
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
          className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg"
        >
          <Menu size={24} className="text-black" />
        </button>
      )}

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-white border-r z-40
          w-64 transform transition-transform duration-200 ease-in-out
          lg:transform-none
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo and Close Button Container */}
          <div className="h-16 px-6 border-b flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-black">
              ElementPay
            </Link>
            {isOpen && (
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-black" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
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
                  <div className="ml-4 space-y-1">
                    <SubLink
                      label="Overview"
                      active={currentPage === "overview"}
                      onClick={() => handlePageChange("overview")}
                      pageName="overview"
                    />
                    <SubLink label="Notifications" badge="10" />
                    <SubLink label="Recent transactions" />
                  </div>
                )}
              </SidebarLink>
              <SidebarLink
                icon={<Wallet size={20} />}
                label="My wallets"
                active={currentPage === "wallets"}
                onClick={() => handlePageChange("wallets")}
                pageName="wallets"
              />
              <SidebarLink
                icon={<Clock size={20} />}
                label="Transactions"
                active={currentPage === "transactions"}
                onClick={() => handlePageChange("transactions")}
                pageName="transactions"
              />
              <SidebarLink
                icon={<HandCoinsIcon size={20} />}
                label="Hakiba"
                subMenu={true}
                active={currentPage.startsWith("hakiba")}
                onClick={() => toggleMenu("hakiba")}
              >
                {expandedMenus.includes("hakiba") && (
                  <div className="ml-8 space-y-1 mt-1">
                    <SubLink
                      label="Overview"
                      active={currentPage === "hakiba"}
                      onClick={() => handlePageChange("hakiba")}
                    />
                    <SubLink
                      label="Loans"
                      active={currentPage === "loans"}
                      onClick={() => handlePageChange("loans")}
                    />
                    <SubLink
                      label="Credit Score"
                      active={currentPage === "credit-score"}
                      onClick={() => handlePageChange("credit-score")}
                    />
                  </div>
                )}
              </SidebarLink>
              <SidebarLink
                icon={<CreditCard size={20} />}
                label="Virtual Cards"
                active={currentPage === "cards"}
                onClick={() => handlePageChange("cards")}
                pageName="cards"
              />
            </div>

            {/* Support and Settings Section */}
            <div className="mt-auto pt-4 border-t space-y-1">
              {/* Support Section with Submenu */}
              <SidebarLink
                icon={<HelpCircle size={20} />}
                label="Support"
                subMenu={true}
                active={currentPage.startsWith("support")}
                onClick={() => toggleMenu("support")}
              >
                {expandedMenus.includes("support") && (
                  <div className="ml-4 space-y-1 mt-1">
                    <SubLink
                      icon={
                        <MessageCircle size={16} className="text-green-500" />
                      }
                      label="WhatsApp"
                      active={currentPage === "support-whatsapp"}
                      onClick={() => handlePageChange("support-whatsapp")}
                      status="Online"
                    />
                    <SubLink
                      icon={<Mail size={16} className="text-gray-500" />}
                      label="Email"
                      active={currentPage === "support-email"}
                      onClick={() => handlePageChange("support-email")}
                    />
                  </div>
                )}
              </SidebarLink>

              {/* Settings Section */}
              <SidebarLink
                icon={<Settings size={20} />}
                label="Settings"
                active={currentPage === "settings"}
                onClick={() => handlePageChange("settings")}
                pageName="settings"
              />
            </div>

            {/* Share link and earn */}
            <div className="mt-4 bg-gray-200 rounded-xl p-4 text-center shadow-md">
              <img
                src="https://cdn-icons-png.freepik.com/256/13515/13515379.png"
                alt="Referral Icon"
                className="w-12 h-12 mx-auto"
              />
              <h1 className="text-gray-800 font-semibold mt-2 text-sm">Refer to Hakiba</h1>
              <p className="text-gray-600 text-xs mt-1">
                Share our link and earn $5 for every successful referral
              </p>
              <div className="flex justify-around items-center mt-3 text-sm">
                <button className="text-gray-600">Dismiss</button>
                <button
                  className="text-blue-600"
                  onClick={() => handlePageChange("referral")}
                >
                  Referral
                </button>
              </div>
            </div>

          </nav>
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
  <div className="space-y-1">
    <button
      className={`flex w-full items-center gap-3 px-3 py-2 rounded-lg transition-colors ${active ? "bg-gray-100" : "hover:bg-gray-50"
        }`}
      onClick={onClick}
    >
      <span className="text-gray-500">{icon}</span>
      <span
        className={`${active ? "font-medium text-gray-900" : "text-gray-700"}`}
      >
        {label}
      </span>
      {badge && (
        <span className="ml-auto bg-gray-100 px-2 py-1 rounded-full text-xs">
          {badge}
        </span>
      )}
      {subMenu && (
        <span className="ml-auto transform transition-transform duration-200">
          {active ? "▼" : "▶"}
        </span>
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
    className={`flex items-center w-full pl-3 py-2 text-sm rounded-lg transition-colors ${active ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-gray-50"
      }`}
  >
    {icon && <span className="mr-2">{icon}</span>}
    <span>{label}</span>
    {status && (
      <span className="ml-auto text-xs text-green-600 px-2">{status}</span>
    )}
    {badge && (
      <span className="ml-auto bg-gray-100 px-2 py-1 rounded-full text-xs">
        {badge}
      </span>
    )}
  </button>
);

export default Sidebar;
