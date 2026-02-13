import { useState } from "react";
import { SUPPORTED_TOKENS, SupportedToken } from "@/constants/supportedTokens";

interface TokenDropdownProps {
  selected: SupportedToken;
  onSelect: (token: SupportedToken) => void | Promise<void>;
  disabled?: boolean;
}

export default function TokenDropdown({ selected, onSelect, disabled = false }: TokenDropdownProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = () => {
    if (disabled) return;
    setOpen(!open);
  };

  const handleSelect = async (token: SupportedToken) => {
    setOpen(false);
    // Handle both sync and async onSelect
    await onSelect(token);
  };

  return (
    <div className="relative w-full max-w-xs">
      <button
        className={`w-full flex items-center justify-between border rounded-lg px-4 py-2 bg-white shadow-sm ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={handleToggle}
        type="button"
        disabled={disabled}
      >
        <div className="flex items-center space-x-2">
          <img src={selected.tokenLogo} alt={selected.symbol} className="w-6 h-6" />
          <span className="font-semibold">{selected.symbol}</span>
          <span className="text-xs text-gray-500 flex items-center ml-2">
            <img src={selected.chainLogo} alt={selected.chain} className="w-4 h-4 mr-1" />
            {selected.chain}
          </span>
        </div>
        <svg className={`w-4 h-4 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div 
          className="absolute z-50 mt-2 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto"
          style={{ minHeight: '100px' }}
        >
          {SUPPORTED_TOKENS.map((token) => {
            const isSelected = token.symbol === selected.symbol && token.chain === selected.chain;
            return (
              <button
                key={token.symbol + token.chain}
                className={`w-full flex items-center px-4 py-2 hover:bg-gray-100 ${
                  isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                }`}
                onClick={() => handleSelect(token)}
                type="button"
              >
                <img src={token.tokenLogo} alt={token.symbol} className="w-5 h-5" />
                <span className="ml-2 font-semibold">{token.symbol}</span>
                <span className="ml-2 text-xs text-gray-500 flex items-center">
                  <img src={token.chainLogo} alt={token.chain} className="w-4 h-4 mr-1" />
                  {token.chain}
                </span>
                {isSelected && (
                  <svg className="ml-auto w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
