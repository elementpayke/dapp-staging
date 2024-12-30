import { FC } from "react";
import { Copy } from "lucide-react";

interface Transaction {
  id: string;
  name: string;
  time: string;
  hash: string;
  status: "Success" | "Pending" | "Failed";
  amount: string;
  description?: string;
}

const TransactionList: FC = () => {
  const transactions: Transaction[] = [
    {
      id: "1",
      name: "Peter Kamau Mbuthia",
      time: "Today, 3:43 PM",
      hash: "FTA41uY-ax6EZ3..89ScF2qF1Bfxa",
      status: "Success",
      amount: "KE 200.00",
      description: "0703417782",
    },
    {
      id: "2",
      name: "Peter Kamau Mbuthia",
      time: "Today, 3:43 PM",
      hash: "FTA41uY-ax6EZ3..89ScF2qF1Bfxa",
      status: "Success",
      amount: "KE 200.00",
      description: "Paybill",
    },
    {
      id: "3",
      name: "Peter Kamau Mbuthia",
      time: "Today, 3:43 PM",
      hash: "FTA41uY-ax6EZ3..89ScF2qF1Bfxa",
      status: "Success",
      amount: "KE 200.00",
      description: "LIPA NA MPESA",
    },
    {
      id: "4",
      name: "Peter Kamau Mbuthia",
      time: "Today, 3:43 PM",
      hash: "FTA41uY-ax6EZ3..89ScF2qF1Bfxa",
      status: "Success",
      amount: "KE 200.00",
      description: "Pochi La Biashara",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-black">Recent transactions</h2>
        <button className="text-blue-600 hover:text-blue-700">View All</button>
      </div>

      <div className="bg-white rounded-lg overflow-hidden">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center px-6 py-4 border-b last:border-b-0 hover:bg-gray-50"
          >
            {/* Name and Time */}
            <div className="w-64">
              <div className="text-sm font-medium text-gray-900">{tx.name}</div>
              <div className="text-xs text-gray-500">{tx.time}</div>
            </div>

            {/* Hash with Copy Icon */}
            <div className="flex items-center flex-1 text-gray-500">
              <Copy className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-sm">{tx.hash}</span>
            </div>

            {/* Status Badge */}
            <div className="w-24 flex justify-center">
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                {tx.status}
              </span>
            </div>

            {/* Description */}
            <div className="w-48 text-sm text-gray-600">{tx.description}</div>

            {/* Amount */}
            <div className="w-32 text-right">
              <span className="text-sm font-medium text-green-600">
                {tx.amount}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionList;
