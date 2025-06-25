import React from "react";

interface TabsProps {
  activeTab: "details" | "receipt";
  setActiveTab: (tab: "details" | "receipt") => void;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => (
  <div className="flex border-b mb-4">
    <button
      className={`px-4 py-2 font-medium text-sm ${
        activeTab === "details"
          ? "text-blue-600 border-b-2 border-blue-600"
          : "text-gray-500 hover:text-gray-700"
      }`}
      onClick={() => setActiveTab("details")}
    >
      Transaction Details
    </button>
    <button
      className={`px-4 py-2 font-medium text-sm ${
        activeTab === "receipt"
          ? "text-blue-600 border-b-2 border-blue-600"
          : "text-gray-500 hover:text-gray-700"
      }`}
      onClick={() => setActiveTab("receipt")}
    >
      Receipt
    </button>
  </div>
);

export default Tabs;
