"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useModalOverlay } from "@/hooks/useModalOverlay";

const DialogWithOverlay = ({ children, onOpenChange, ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Use our modal overlay hook
  useModalOverlay(isOpen);
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  return (
    <DialogPrimitive.Root onOpenChange={handleOpenChange} {...props}>
      {children}
    </DialogPrimitive.Root>
  );
};

export { DialogWithOverlay };
