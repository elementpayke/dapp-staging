import { useState } from "react";
import { SUPPORTED_TOKENS, SupportedToken } from "@/constants/supportedTokens";

interface TokenDropdownProps {
  selected: SupportedToken;
  onSelect: (token: SupportedToken) => void;
}

export default function TokenDropdown({ selected, onSelect }: TokenDropdownProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = () => {
    const newOpen = !open;
    console.log('TokenDropdown toggle:', { from: open, to: newOpen });
    setOpen(newOpen);
  };

  console.log('TokenDropdown render:', { open, tokensCount: SUPPORTED_TOKENS.length });

  return (
    <div className="relative w-full max-w-xs">
      <button
        className="w-full flex items-center justify-between border rounded-lg px-4 py-2 bg-white shadow-sm"
        onClick={handleToggle}
        type="button"
      >
        <div className="flex items-center space-x-2">
          <img src={selected.tokenLogo} alt={selected.symbol} className="w-6 h-6" />
          <span className="font-semibold">{selected.symbol}</span>
          <span className="text-xs text-gray-500 flex items-center ml-2">
            <img src={selected.chainLogo} alt={selected.chain} className="w-4 h-4 mr-1" />
            {selected.chain}
          </span>
        </div>
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div 
          className="absolute z-50 mt-2 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto"
          style={{ minHeight: '100px' }}
        >
          {SUPPORTED_TOKENS.map((token) => {
            console.log('Rendering token:', token.symbol, token.chain);
            return (
            <button
              key={token.symbol + token.chain}
              className="w-full flex items-center px-4 py-2 hover:bg-gray-100"
              onClick={() => {
                onSelect(token);
                setOpen(false);
              }}
              type="button"
            >
              <img src={token.tokenLogo} alt={token.symbol} className="w-5 h-5" />
              <span className="ml-2 font-semibold">{token.symbol}</span>
              <span className="ml-2 text-xs text-gray-500 flex items-center">
                <img src={token.chainLogo} alt={token.chain} className="w-4 h-4 mr-1" />
                {token.chain}
              </span>
            </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
