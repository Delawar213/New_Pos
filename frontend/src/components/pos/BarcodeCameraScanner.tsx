"use client";

import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { X, Loader2, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called with trimmed barcode text when decode succeeds. */
  onDetected: (code: string) => void;
};

/**
 * Live camera barcode scan using device webcam / rear camera (ZXing).
 * Requires HTTPS or localhost and camera permission.
 */
export function BarcodeCameraScanner({ open, onClose, onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onDetectedRef = useRef(onDetected);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  onDetectedRef.current = onDetected;

  useEffect(() => {
    if (!open) {
      setError(null);
      setStarting(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    setError(null);
    setStarting(true);

    const reader = new BrowserMultiFormatReader();
    let finished = false;

    const controlsPromise = reader.decodeFromVideoDevice(undefined, video, (result) => {
      if (finished || !result) return;
      const text = result.getText().trim();
      if (!text) return;
      finished = true;
      void controlsPromise
        .then((controls) => controls.stop())
        .catch(() => {})
        .finally(() => {
          onDetectedRef.current(text);
        });
    });

    controlsPromise
      .then(() => {
        if (!finished) setStarting(false);
      })
      .catch((e: unknown) => {
        if (!finished) {
          setStarting(false);
          setError(e instanceof Error ? e.message : "Camera could not start");
        }
      });

    return () => {
      finished = true;
      void controlsPromise.then((c) => c.stop()).catch(() => {});
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 p-3 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Scan barcode with camera"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2 text-slate-800">
            <Camera className="h-5 w-5 text-blue-600" />
            <span className="font-bold">Camera scanner</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close scanner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative bg-black p-2">
          <video
            ref={videoRef}
            className={cn("mx-auto max-h-[50vh] w-full rounded-lg object-cover", starting && "opacity-60")}
            muted
            playsInline
            autoPlay
          />
          {starting && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-white" />
            </div>
          )}
        </div>

        <div className="space-y-2 px-4 py-3 text-sm text-slate-600">
          {error ? (
            <p className="font-medium text-rose-600">{error}</p>
          ) : (
            <p>Point the camera at a barcode. The item is added when a code is read.</p>
          )}
          <p className="text-xs text-slate-400">
            USB scanners: focus the barcode field — they type the code like a keyboard.
          </p>
        </div>
      </div>
    </div>
  );
}
