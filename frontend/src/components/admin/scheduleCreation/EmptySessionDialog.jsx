import React from "react";
import { CalendarRange, Loader2, Sparkles } from "lucide-react";
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

const DAY_ORDER = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
};

function compareSessionEntries(left, right) {
  const leftGroup = String(left?.groupName || "").trim();
  const rightGroup = String(right?.groupName || "").trim();

  const leftGroupMatch = leftGroup.match(/^(.*?)(?:[-\s]?G(\d+))?$/i);
  const rightGroupMatch = rightGroup.match(/^(.*?)(?:[-\s]?G(\d+))?$/i);

  const leftPrefix = String(leftGroupMatch?.[1] || leftGroup).trim();
  const rightPrefix = String(rightGroupMatch?.[1] || rightGroup).trim();
  const prefixCompare = leftPrefix.localeCompare(rightPrefix, undefined, { numeric: true, sensitivity: "base" });
  if (prefixCompare !== 0) return prefixCompare;

  const leftGroupNumber = Number.parseInt(leftGroupMatch?.[2] || "", 10);
  const rightGroupNumber = Number.parseInt(rightGroupMatch?.[2] || "", 10);
  if (Number.isInteger(leftGroupNumber) && Number.isInteger(rightGroupNumber) && leftGroupNumber !== rightGroupNumber) {
    return leftGroupNumber - rightGroupNumber;
  }

  const leftDay = DAY_ORDER[left?.day] || 99;
  const rightDay = DAY_ORDER[right?.day] || 99;
  if (leftDay !== rightDay) return leftDay - rightDay;

  return String(left?.slot || "").localeCompare(String(right?.slot || ""), undefined, { numeric: true, sensitivity: "base" });
}

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
  const targetLabel = emptyCellDialog.scope === "single"
    ? emptyCellDialog.group?.name || "the selected group"
    : "all generated schedules";
  const orderedSessions = [...(emptyCellDialog.sessions || [])].sort(compareSessionEntries);

  return (
    <Dialog open={emptyCellDialog.open} onOpenChange={(open) => !open && closeEmptyCellDialog()}>
      <DialogContent className="flex max-h-[92vh] max-w-[95vw] flex-col overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl sm:max-w-2xl sm:rounded-3xl">
        <DialogHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 sm:h-12 sm:w-12">
              <CalendarRange className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <DialogTitle className="text-lg font-semibold text-slate-900 sm:text-xl">Fill Empty Sessions</DialogTitle>
              <DialogDescription className="mt-1.5 text-xs leading-5 text-slate-500 sm:text-sm">
                Enter text to place in every empty session for <span className="font-semibold text-slate-700">{targetLabel}</span>. Leave it blank to keep empty sessions empty.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 space-y-5 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Sparkles className="h-4 w-4 text-blue-500" />
              Replacement text
            </div>

            <Textarea
              value={emptyCellText}
              onChange={(event) => setEmptyCellText(event.target.value)}
              rows={3}
              maxLength={100}
              placeholder="Example: Capstone I"
              className="rounded-xl border-slate-300 bg-white"
            />

            <div className="mt-2 text-right text-xs text-slate-400">
              {String(emptyCellText || "").length}/100
            </div>
          </div>

          {emptyCellDialog.loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin text-blue-500" />
              Loading empty sessions...
            </div>
          ) : emptyCellDialog.sessions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
              No empty sessions found for this generation scope.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="max-w-xl text-xs leading-5 text-slate-500">
                  Select which empty sessions should use the entered text. Unselected sessions will stay empty.
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100">
                    <Checkbox
                      checked={allEmptySessionsSelected}
                      onCheckedChange={(checked) => (checked ? selectAllEmptySessions() : clearAllEmptySessions())}
                    />
                    <span className="whitespace-nowrap">Select all</span>
                  </label>
                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100">
                    <Checkbox
                      checked={noEmptySessionsSelected}
                      onCheckedChange={(checked) => (checked ? clearAllEmptySessions() : selectAllEmptySessions())}
                    />
                    <span className="whitespace-nowrap">Clear all</span>
                  </label>
                </div>
              </div>

              <div className="max-h-56 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 sm:max-h-72">
                {orderedSessions.map((session) => (
                  <label
                    key={session.key}
                    className="flex items-start gap-3 rounded-xl border border-transparent px-3 py-3 transition-colors hover:border-slate-200 hover:bg-slate-50"
                  >
                    <Checkbox
                      checked={selectedEmptySessionKeys.includes(session.key)}
                      onCheckedChange={(checked) => toggleEmptySessionSelection(session.key, !!checked)}
                      className="mt-0.5"
                    />
                    <span className="flex min-w-0 flex-1 flex-col text-sm text-slate-700">
                      <span className="font-semibold text-slate-800">{session.groupName}</span>
                      <span className="mt-0.5 text-xs text-slate-500">{session.day} · {session.slot}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="shrink-0 flex flex-col-reverse gap-3 border-t border-slate-100 bg-white px-4 py-4 sm:flex-row sm:justify-end sm:px-6 sm:py-5">
          <Button type="button" onClick={closeEmptyCellDialog} variant="outline" className="w-full rounded-xl sm:w-auto">Cancel</Button>
          <Button type="button" onClick={handleGenerateWithBlankEmptyCells} variant="secondary" className="w-full rounded-xl sm:w-auto">Keep Blank</Button>
          <Button
            type="button"
            onClick={handleConfirmEmptyCellDialog}
            disabled={emptyCellDialog.loading || !String(emptyCellText || "").trim() || selectedEmptySessionKeys.length === 0}
            className="w-full rounded-xl sm:w-auto"
          >
            Generate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}