"use client";

import Image from "next/image";
import { Github, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/70 bg-card/60 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-2 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <Image
            src="/aci-logo.png"
            alt="ACI logo"
            width={16}
            height={16}
            className="h-4 w-4 object-contain"
          />
          <span>
            <span className="font-medium text-foreground/80">
              ACI Field Feedback Console
            </span>{" "}
            · Internal analytics platform
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Data governed by ACI Information Security
          </span>
          <span className="hidden items-center gap-1 sm:inline-flex">
            <Github className="h-3.5 w-3.5" />
            v1.0.0 · Pharma
          </span>
        </div>
      </div>
    </footer>
  );
}
