import React, { useState } from "react";
import { Search, Filter, Copy } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";

interface Transaction {
  id: string;
  name: string;
  time: string;
  date: string;
  hash: string;
  status: "Success" | "Pending" | "Declined";
  description: string;
  amount: string;
}

const TransactionsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Sample transaction data grouped by date
  const transactions: { [key: string]: Transaction[] } = {
    "Today, 6 Jan 2025": [
      {
        id: "1",
        name: "Peter Kamau Mbuthia",
        time: "Today, 3:43 PM",
        date: "Today, 6 Jan 2025",
        hash: "FTA41uY-ax6EZ3..89ScF2qF1Bfxa",
        status: "Pending",
        description: "0703417782",
        amount: "KE 200.00",
      },
      {
        id: "2",
        name: "Peter Kamau Mbuthia",
        time: "Today, 3:43 PM",
        date: "Today, 6 Jan 2025",
        hash: "FTA41uY-ax6EZ3..89ScF2qF1Bfxa",
        status: "Success",
        description: "Paybill",
        amount: "KE 200.00",
      },
      {
        id: "3",
        name: "Peter Kamau Mbuthia",
        time: "Today, 3:43 PM",
        date: "Today, 6 Jan 2025",
        hash: "FTA41uY-ax6EZ3..89ScF2qF1Bfxa",
        status: "Success",
        description: "LIPA NA MPESA",
        amount: "KE 200.00",
      },
    ],
    "Friday, 3 Jan 2025": [
      {
        id: "4",
        name: "Peter Kamau Mbuthia",
        time: "Today, 3:43 PM",
        date: "Friday, 3 Jan 2025",
        hash: "FTA41uY-ax6EZ3..89ScF2qF1Bfxa",
        status: "Success",
        description: "Pochi La Biashara",
        amount: "KE 200.00",
      },
      {
        id: "5",
        name: "Peter Kamau Mbuthia",
        time: "Today, 3:43 PM",
        date: "Friday, 3 Jan 2025",
        hash: "FTA41uY-ax6EZ3..89ScF2qF1Bfxa",
        status: "Declined",
        description: "Pochi La Biashara",
        amount: "KE 200.00",
      },
      {
        id: "6",
        name: "Peter Kamau Mbuthia",
        time: "Today, 3:43 PM",
        date: "Friday, 3 Jan 2025",
        hash: "FTA41uY-ax6EZ3..89ScF2qF1Bfxa",
        status: "Success",
        description: "Pochi La Biashara",
        amount: "KE 200.00",
      },
    ],
    "Thursday 2 Jan 2025": Array(7)
      .fill(null)
      .map((_, index) => ({
        id: `${index + 7}`,
        name: "Peter Kamau Mbuthia",
        time: "Today, 3:43 PM",
        date: "Thursday 2 Jan 2025",
        hash: "FTA41uY-ax6EZ3..89ScF2qF1Bfxa",
        status: "Success",
        description: "Pochi La Biashara",
        amount: "KE 200.00",
      })),
  };

  const getStatusStyle = (status: Transaction["status"]) => {
    switch (status) {
      case "Success":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-orange-100 text-orange-800";
      case "Declined":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 w-full lg:ml-64 p-8">
        <div className="space-y-6">
          {/* Header with Search and Filter */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-black">Transactions</h1>
            <div className="flex gap-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search transactions"
                  className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {/* Filter Button */}
              <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white rounded-lg shadow">
            {Object.entries(transactions).map(([date, dayTransactions]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="px-6 py-4 border-b bg-gray-50">
                  <h2 className="font-medium text-gray-900">{date}</h2>
                </div>

                {/* Transactions */}
                {dayTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center px-6 py-4 border-b last:border-b-0 hover:bg-gray-50"
                  >
                    {/* Name and Time */}
                    <div className="w-64">
                      <div className="font-medium text-gray-900">
                        {transaction.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {transaction.time}
                      </div>
                    </div>

                    {/* Hash with Copy Icon */}
                    <div className="flex items-center flex-1 text-gray-500">
                      <button className="flex items-center gap-2 hover:text-gray-700">
                        <Copy className="w-4 h-4" />
                        <span className="text-sm">{transaction.hash}</span>
                      </button>
                    </div>

                    {/* Status Badge */}
                    <div className="w-24 flex justify-center">
                      <span
                        className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusStyle(
                          transaction.status
                        )}`}
                      >
                        {transaction.status}
                      </span>
                    </div>

                    {/* Description */}
                    <div className="w-48 text-sm text-gray-600">
                      {transaction.description}
                    </div>

                    {/* Amount */}
                    <div className="w-32 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {transaction.amount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center gap-2 mt-6">
            {[1, 2, 3, 4, 5, 6, "...", 10].map((page, index) => (
              <button
                key={index}
                className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => {
                  if (typeof page === "number") {
                    setCurrentPage(page);
                  }
                }}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
