import Link from "next/link";
import {
  Home,
  Clock,
  Wallet,
  CreditCard,
  Settings,
  HelpCircle,
} from "lucide-react";
import { ReactNode } from "react";

interface SidebarLinkProps {
  icon: ReactNode;
  label: string;
  children?: ReactNode;
  active?: boolean;
  badge?: string;
}

interface SubLinkProps {
  label: string;
  active?: boolean;
  badge?: string;
}

const Sidebar = () => {
  return (
    <div className="w-64 bg-white border-r h-screen fixed left-0 top-0">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b">
          <Link href="/" className="text-2xl font-bold text-black">
            ElementsPay
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <SidebarLink icon={<Home size={20} />} label="Home" active>
              <div className="ml-4 space-y-1">
                <SubLink label="Overview" active />
                <SubLink label="Notifications" badge="10" />
                <SubLink label="Recent transactions" />
              </div>
            </SidebarLink>
            <SidebarLink icon={<Wallet size={20} />} label="My wallets" />
            <SidebarLink icon={<Clock size={20} />} label="Transactions" />
            <SidebarLink
              icon={<CreditCard size={20} />}
              label="Virtual Cards"
            />
          </div>

          {/* Bottom section */}
          <div className="mt-auto pt-4 border-t space-y-1">
            <SidebarLink icon={<HelpCircle size={20} />} label="Support" />
            <SidebarLink icon={<Settings size={20} />} label="Settings" />
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
            <button className="mt-3 text-sm text-blue-600">Referral</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SidebarLink: React.FC<SidebarLinkProps> = ({
  icon,
  label,
  children,
  active,
  badge,
}) => (
  <div className="space-y-1">
    <Link
      href="#"
      className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
        active ? "bg-gray-100" : "hover:bg-gray-50"
      }`}
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

const SubLink: React.FC<SubLinkProps> = ({ label, active, badge }) => (
  <Link
    href="#"
    className={`block pl-12 py-2 text-sm rounded-lg ${
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
