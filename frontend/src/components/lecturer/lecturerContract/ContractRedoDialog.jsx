import { useState } from "react";
import { FilePen, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../ui/Dialog";
import Button from "../../ui/Button";

export default function ContractRedoDialog({ isOpen, onClose }) {
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      console.log("Redo request submitted:", comment);
      setComment("");
      onClose();
    } catch (error) {
      console.error("Submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5">
          <DialogTitle className="flex items-center gap-2">
            <FilePen className="w-4 h-4" /> Request Redo Contract
          </DialogTitle>
          <DialogDescription>
            Describe what changes you would like to be made to the contract.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 pt-2 space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="redo-comment"
              className="text-sm font-medium text-gray-700"
            >
              What would you like to change?
            </label>
            <textarea
              id="redo-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. I'd like to adjust the payment terms, update the delivery date..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-10 px-4 min-w-[120px]"
            >
              Cancel
            </Button>

            <button
              onClick={handleSubmit}
              disabled={submitting || !comment.trim()}
              className={`h-10 px-4 min-w-[160px] border rounded-lg bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center justify-center text-sm font-medium ${
                submitting || !comment.trim()
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Request
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
