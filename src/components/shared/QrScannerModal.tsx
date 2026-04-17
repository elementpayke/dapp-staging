"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (value: string) => void;
}

export default function QrScannerModal({ open, onClose, onScan }: QrScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const scannerId = "qr-scanner-region";
    let stopped = false;

    const start = async () => {
      try {
        const scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText: string) => {
            if (!stopped) {
              stopped = true;
              onScan(decodedText);
              onClose();
            }
          },
          () => {
            /* ignore scan failures */
          },
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Camera access denied. Please allow camera permissions.",
        );
      }
    };

    // Small delay to let the DOM mount the container
    const timer = setTimeout(start, 300);

    return () => {
      clearTimeout(timer);
      stopped = true;
      scannerRef.current
        ?.stop()
        .catch(() => {})
        .finally(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
        });
    };
  }, [open, onScan, onClose]);

  // Reset error when reopened
  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[95vw] max-w-sm p-4 bg-[var(--ep-bg-card)] border border-[var(--ep-border)] rounded-2xl">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-[var(--ep-accent)]" />
              <DialogTitle className="text-sm font-semibold text-[var(--ep-heading)]">
                Scan QR Code
              </DialogTitle>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-[var(--ep-bg-input)] transition-colors"
            >
              <X className="h-4 w-4 text-[var(--ep-muted)]" />
            </button>
          </div>
        </DialogHeader>

        <div className="overflow-hidden rounded-xl bg-black">
          <div id="qr-scanner-region" className="w-full" />
        </div>

        {error && (
          <p className="mt-1 text-xs text-red-500 text-center">{error}</p>
        )}

        <p className="text-center text-[11px] text-[var(--ep-muted)]">
          Point your camera at a wallet address QR code
        </p>
      </DialogContent>
    </Dialog>
  );
}
