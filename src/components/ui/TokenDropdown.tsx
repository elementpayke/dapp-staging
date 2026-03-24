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
    await onSelect(token);
  };

  return (
    <div className="relative w-full max-w-xs">
      {/* Trigger button — bg-white → bg-[var(--ep-bg-input)], border → border-[var(--ep-border)] */}
      <button
        className={`w-full flex items-center justify-between border border-[var(--ep-border)] rounded-lg px-4 py-2 bg-[var(--ep-bg-input)] shadow-sm transition-colors ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[var(--ep-bg-elevated)]"
        }`}
        onClick={handleToggle}
        type="button"
        disabled={disabled}
      >
        <div className="flex items-center space-x-2">
          <img src={selected.tokenLogo} alt={selected.symbol} className="w-6 h-6" />
          {/* font-semibold text — inherits from ep-heading */}
          <span className="font-semibold text-[var(--ep-heading)]">{selected.symbol}</span>
          {/* text-gray-500 → text-[var(--ep-muted)] */}
          <span className="text-xs text-[var(--ep-muted)] flex items-center ml-2">
            <img src={selected.chainLogo} alt={selected.chain} className="w-4 h-4 mr-1" />
            {selected.chain}
          </span>
        </div>
        {/* Chevron — text-[var(--ep-muted)] so it's visible in both themes */}
        <svg
          className={`w-4 h-4 ml-2 transition-transform text-[var(--ep-muted)] ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        // Dropdown panel — bg-white → bg-[var(--ep-bg-card)], border → border-[var(--ep-border)]
        <div
          className="absolute z-50 mt-2 w-full bg-[var(--ep-bg-card)] border border-[var(--ep-border)] rounded-lg shadow-lg max-h-60 overflow-y-auto"
          style={{ minHeight: "100px" }}
        >
          {SUPPORTED_TOKENS.map((token) => {
            const isSelected = token.symbol === selected.symbol && token.chain === selected.chain;
            return (
              <button
                key={token.symbol + token.chain}
                className={`w-full flex items-center px-4 py-2 transition-colors ${
                  isSelected
                    // bg-blue-50 → bg-[var(--ep-accent-muted)], border-blue-500 → border-[var(--ep-accent)]
                    ? "bg-[var(--ep-accent-muted)] border-l-2 border-[var(--ep-accent)]"
                    // hover:bg-gray-100 → hover:bg-[var(--ep-bg-elevated)]
                    : "hover:bg-[var(--ep-bg-elevated)]"
                }`}
                onClick={() => handleSelect(token)}
                type="button"
              >
                <img src={token.tokenLogo} alt={token.symbol} className="w-5 h-5" />
                <span className="ml-2 font-semibold text-[var(--ep-heading)]">{token.symbol}</span>
                {/* text-gray-500 → text-[var(--ep-muted)] */}
                <span className="ml-2 text-xs text-[var(--ep-muted)] flex items-center">
                  <img src={token.chainLogo} alt={token.chain} className="w-4 h-4 mr-1" />
                  {token.chain}
                </span>
                {isSelected && (
                  // text-blue-500 → text-[var(--ep-accent)]
                  <svg className="ml-auto w-4 h-4 text-[var(--ep-accent)]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
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
