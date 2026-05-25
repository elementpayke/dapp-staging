"use client";

import React, { Component, ReactNode, useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { AlertTriangle, Camera } from "lucide-react";
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

/* ─── Local error boundary ───────────────────────────────────────
 * Contains any crash thrown from the camera/scanner subtree so
 * the host app stays alive. Renders a friendly fallback inside
 * the same Dialog — the user can still close the modal.
 * ───────────────────────────────────────────────────────────── */
interface BoundaryProps {
  children: ReactNode;
  onError?: (error: Error) => void;
}
interface BoundaryState {
  error: Error | null;
}

class ScannerErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.warn("[QrScannerModal] camera subtree crashed:", error, info);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <p className="text-sm font-semibold text-red-700">
            Camera unavailable
          </p>
          <p className="text-xs text-red-600">
            {this.state.error.message || "The scanner crashed. Please close and try again."}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─── Inner scanner (all camera side-effects live here) ─── */
interface ScannerViewProps {
  onScan: (value: string) => void;
  onClose: () => void;
}

function ScannerView({ onScan, onClose }: ScannerViewProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const scannerId = "qr-scanner-region";
    let stopped = false;

    const start = async () => {
      try {
        const scanner = new Html5Qrcode(scannerId);

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
            /* ignore per-frame decode failures */
          },
        );

        // Only assign ref after successful start — prevents stop() on
        // an uninitialised scanner when permission is denied.
        scannerRef.current = scanner;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Camera access denied. Please allow camera permissions.",
        );
      }
    };

    const timer = setTimeout(start, 300);

    return () => {
      clearTimeout(timer);
      stopped = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (!scanner) return;

      const shouldStop =
        scanner.getState?.() === Html5QrcodeScannerState.SCANNING;

      const cleanup = () => {
        try {
          scanner.clear();
        } catch {
          /* noop */
        }
      };

      if (shouldStop) {
        try {
          scanner.stop().catch(() => {}).finally(cleanup);
        } catch {
          cleanup();
        }
      } else {
        cleanup();
      }
    };
  }, [onScan, onClose]);

  return (
    <>
      <div className="overflow-hidden rounded-xl bg-black">
        <div id="qr-scanner-region" className="w-full" />
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-500 text-center">{error}</p>
      )}

      <p className="text-center text-[11px] text-[var(--ep-muted)]">
        Point your camera at a wallet address QR code
      </p>
    </>
  );
}

/* ─── Public component ─── */
export default function QrScannerModal({ open, onClose, onScan }: QrScannerModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[95vw] max-w-sm p-4 bg-[var(--ep-bg-card)] border border-[var(--ep-border)] rounded-2xl">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-[var(--ep-accent)]" />
            <DialogTitle className="text-sm font-semibold text-[var(--ep-heading)]">
              Scan QR Code
            </DialogTitle>
          </div>
        </DialogHeader>

        {open && (
          <ScannerErrorBoundary>
            <ScannerView onScan={onScan} onClose={onClose} />
          </ScannerErrorBoundary>
        )}
      </DialogContent>
    </Dialog>
  );
}
