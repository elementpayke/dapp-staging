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
} from "lucide-react";
import { ReactNode, useState } from "react";

interface SidebarLinkProps {
  icon: ReactNode;
  label: string;
  children?: ReactNode;
  active?: boolean;
  badge?: string;
  onClick?: () => void;
}

interface SubLinkProps {
  label: string;
  active?: boolean;
  badge?: string;
}

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

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
          <div className="p-6 border-b flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-black">
              ElementsPay
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
                active
                onClick={() => setIsOpen(false)}
              >
                <div className="ml-4 space-y-1">
                  <SubLink label="Overview" active />
                  <SubLink label="Notifications" badge="10" />
                  <SubLink label="Recent transactions" />
                </div>
              </SidebarLink>
              <SidebarLink
                icon={<Wallet size={20} />}
                label="My wallets"
                onClick={() => setIsOpen(false)}
              />
              <SidebarLink
                icon={<Clock size={20} />}
                label="Transactions"
                onClick={() => setIsOpen(false)}
              />
              <SidebarLink
                icon={<CreditCard size={20} />}
                label="Virtual Cards"
                onClick={() => setIsOpen(false)}
              />
            </div>

            {/* Bottom section */}
            <div className="mt-auto pt-4 border-t space-y-1">
              <SidebarLink
                icon={<HelpCircle size={20} />}
                label="Support"
                onClick={() => setIsOpen(false)}
              />
              <SidebarLink
                icon={<Settings size={20} />}
                label="Settings"
                onClick={() => setIsOpen(false)}
              />
            </div>
          </nav>

          {/* Referral Banner */}
          <div className="p-4 bg-gray-50">
            <div className="p-4 bg-white rounded-lg text-center">
              <div className="mb-2">🎁</div>
              <h3 className="font-medium text-black">Refer and earn</h3>
              <p className="text-sm text-black mt-1">
                Share our link and earn $5 for every successful referral
              </p>
              <button className="mt-3 text-sm text-blue-600 hover:text-blue-700 transition-colors">
                Referral
              </button>
            </div>
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
}) => (
  <div className="space-y-1">
    <Link
      href="#"
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        active ? "bg-gray-100" : "hover:bg-gray-50"
      }`}
      onClick={onClick}
    >
      <span className="text-black">{icon}</span>
      <span className={`${active ? "font-medium text-black" : "text-black"}`}>
        {label}
      </span>
      {badge && (
        <span className="ml-auto bg-gray-100 px-2 py-1 rounded-full text-xs">
          {badge}
        </span>
      )}
    </Link>
    {children}
  </div>
);

// SubLink Component
const SubLink: React.FC<SubLinkProps> = ({ label, active, badge }) => (
  <Link
    href="#"
    className={`block pl-12 py-2 text-sm rounded-lg transition-colors ${
      active ? "text-blue-600 bg-blue-50" : "text-black hover:bg-gray-50"
    }`}
  >
    {label}
    {badge && (
      <span className="ml-2 bg-gray-100 px-2 py-1 rounded-full text-xs">
        {badge}
      </span>
    )}
  </Link>
);

export default Sidebar;
