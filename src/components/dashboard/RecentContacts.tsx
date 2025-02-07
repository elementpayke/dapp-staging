import { FC } from "react";

interface Contact {
  initial: string;
  name: string;
  bgColor: string;
}

const RecentContacts: FC = () => {
  const contacts: Contact[] = [
    { initial: "J", name: "Jeff Mwango", bgColor: "bg-[#FF6B6B]" },
    { initial: "E", name: "Equity Paybill", bgColor: "bg-[#4ECDC4]" },
    { initial: "R", name: "Rent Account", bgColor: "bg-[#45B7D1]" },
    { initial: "K", name: "Kivian wa..", bgColor: "bg-[#96CEB4]" },
    { initial: "M", name: "My Wife", bgColor: "bg-[#FF7F50]" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-black">Transact again</h2>
        <button className="text-blue-600">Add</button>
      </div>

      <div className="flex gap-8 overflow-x-auto py-2">
        {contacts.map((contact, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className={`w-12 h-12 ${contact.bgColor} rounded-full flex items-center justify-center text-white font-medium`}
            >
              {contact.initial}
            </div>
            <span className="mt-2 text-sm text-gray-600 whitespace-nowrap">
              {contact.name}
            </span>
          </div>
        ))}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center text-gray-400">
            +
          </div>
          <span className="mt-2 text-sm text-gray-600">Add Favorite</span>
        </div>
      </div>
    </div>
  );
};

export default RecentContacts;
