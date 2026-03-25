import { useEffect, useState } from 'react';
import { FilePen, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/Dialog';
import Button from '../../ui/Button';

export default function ContractRedoDialog({ open, onOpenChange, contract, onSubmit }) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setComment('');
      setSubmitting(false);
    }
  }, [open]);

  const handleClose = () => {
    if (submitting) return;
    setComment('');
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    const remarks = comment.trim();
    if (!remarks || !contract?.id || !onSubmit) return;

    setSubmitting(true);
    try {
      await onSubmit(contract, remarks);
      toast.success('Redo request submitted');
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to submit redo request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <DialogContent className="w-[95vw] sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5">
          <DialogTitle className="flex items-center gap-2">
            <FilePen className="w-4 h-4" /> Request Redo Contract
          </DialogTitle>
          <DialogDescription>
            Describe what changes should be made before sending the contract back.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 pt-2 space-y-4">
          <div className="space-y-2">
            <label htmlFor="management-redo-comment" className="text-sm font-medium text-gray-700">
              What should be changed?
            </label>
            <textarea
              id="management-redo-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Update the contract period, revise the assigned items, correct the hourly rate..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="h-10 px-4 min-w-[120px]"
            >
              Cancel
            </Button>

            <button
              onClick={handleSubmit}
              disabled={submitting || !comment.trim() || !contract?.id || !onSubmit}
              className={`h-10 px-4 min-w-[160px] border rounded-lg bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center justify-center text-sm font-medium ${
                submitting || !comment.trim() || !contract?.id || !onSubmit
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer'
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