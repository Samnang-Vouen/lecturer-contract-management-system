import React from "react";
import { AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/Dialog";
import Button from "./ui/Button";

/**
 * Reusable error dialog component
 */
export default function ErrorDialog({ open, onOpenChange, error }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Error
          </DialogTitle>
        </DialogHeader>
        <div className="px-2 pb-2 space-y-4">
          <p className="text-sm text-gray-700">{error}</p>
          <div className="flex justify-center">
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white min-w-[100px]"
            >
              OK
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
