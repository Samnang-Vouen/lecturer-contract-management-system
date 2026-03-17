import React from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/Dialog";
import Textarea from "../../ui/Textarea";
import Button from "../../ui/Button";
import Checkbox from "../../ui/Checkbox";

export default function EmptySessionDialog({
  emptyCellDialog,
  closeEmptyCellDialog,
  emptyCellText,
  setEmptyCellText,
  allEmptySessionsSelected,
  noEmptySessionsSelected,
  selectAllEmptySessions,
  clearAllEmptySessions,
  selectedEmptySessionKeys,
  toggleEmptySessionSelection,
  handleGenerateWithBlankEmptyCells,
  handleConfirmEmptyCellDialog,
}) {
  return (
    <Dialog open={emptyCellDialog.open} onOpenChange={(open) => !open && closeEmptyCellDialog()}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Fill Empty Sessions</DialogTitle>
          <DialogDescription>
            Enter text to place in every empty session for {emptyCellDialog.scope === "single"
              ? emptyCellDialog.group?.name || "the selected group"
              : "all generated schedules"}. Leave it blank to keep empty sessions empty.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={emptyCellText}
            onChange={(event) => setEmptyCellText(event.target.value)}
            rows={4}
            placeholder="Example: Self-study / Assignment / Consultation"
            className="bg-white"
          />

          {emptyCellDialog.loading ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin text-blue-500" />
              Loading empty sessions...
            </div>
          ) : emptyCellDialog.sessions.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No empty sessions found for this generation scope.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  Select which empty sessions should use the entered text. Unselected sessions will stay empty.
                </p>
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
                    <Checkbox
                      checked={allEmptySessionsSelected}
                      onCheckedChange={(checked) => (checked ? selectAllEmptySessions() : clearAllEmptySessions())}
                    />
                    <span className="whitespace-nowrap">Select all</span>
                  </label>
                  <label className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
                    <Checkbox
                      checked={noEmptySessionsSelected}
                      onCheckedChange={(checked) => (checked ? clearAllEmptySessions() : selectAllEmptySessions())}
                    />
                    <span className="whitespace-nowrap">Clear all</span>
                  </label>
                </div>
              </div>

              <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
                {emptyCellDialog.sessions.map((session) => (
                  <label
                    key={session.key}
                    className="flex items-start gap-3 rounded-md px-2 py-2 hover:bg-slate-50"
                  >
                    <Checkbox
                      checked={selectedEmptySessionKeys.includes(session.key)}
                      onCheckedChange={(checked) => toggleEmptySessionSelection(session.key, !!checked)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-slate-700">
                      <span className="font-semibold">{session.groupName}</span>
                      <span className="text-slate-400"> · </span>
                      <span>{session.day}</span>
                      <span className="text-slate-400"> · </span>
                      <span>{session.slot}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" onClick={closeEmptyCellDialog} variant="outline" className="w-full sm:w-auto">Cancel</Button>
            <Button type="button" onClick={handleGenerateWithBlankEmptyCells} variant="secondary" className="w-full sm:w-auto">Keep Blank</Button>
            <Button
              type="button"
              onClick={handleConfirmEmptyCellDialog}
              disabled={emptyCellDialog.loading || !String(emptyCellText || "").trim() || selectedEmptySessionKeys.length === 0}
              className="w-full sm:w-auto"
            >
              Generate
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}