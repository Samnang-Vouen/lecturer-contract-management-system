import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, MessageSquare, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/Dialog';
import Button from '../../ui/Button';
import { listRedoRequests } from '../../../services/contract.service';
import { formatContractId, formatMDY } from '../../../utils/lecturerContractHelpers';

function getLatestLecturerRedoRequest(contract, requests) {
  const lecturerRequest = (requests || []).find(
    (row) => String(row?.requester_role || '').toUpperCase() === 'LECTURER'
  );

  if (lecturerRequest) {
    return lecturerRequest;
  }

  if (contract?.management_remarks) {
    return {
      message: contract.management_remarks,
      created_at: contract.updated_at || contract.created_at || null,
      requester_role: contract?.latest_redo_requester_role || 'MANAGEMENT',
    };
  }

  return null;
}

export default function ContractRedoMessageDialog({ isOpen, onClose, contract }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    let cancelled = false;

    if (!isOpen || !contract?.id) {
      setRequests([]);
      setError('');
      setLoading(false);
      return undefined;
    }

    const contractType = String(contract?.contract_type || '').toUpperCase();
    if (contractType === 'ADVISOR') {
      setRequests([]);
      setError('');
      setLoading(false);
      return undefined;
    }

    const loadRequests = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await listRedoRequests(contract.id);
        if (!cancelled) {
          setRequests(Array.isArray(response?.data) ? response.data : []);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError?.response?.data?.message || 'Failed to load redo message');
          setRequests([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadRequests();

    return () => {
      cancelled = true;
    };
  }, [contract?.contract_type, contract?.id, isOpen]);

  const latestRequest = useMemo(
    () => getLatestLecturerRedoRequest(contract, requests),
    [contract, requests]
  );
  const requesterRole = String(latestRequest?.requester_role || '').trim().toUpperCase();
  const requesterLabel = requesterRole === 'MANAGEMENT' ? 'management' : 'lecturer';

  const submittedAt = latestRequest?.created_at ? formatMDY(latestRequest.created_at) : '';
  const contractIdLabel = contract ? formatContractId(contract) : 'Contract';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Redo Message
          </DialogTitle>
          <DialogDescription>{contractIdLabel}</DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 pt-2 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading message...
            </div>
          ) : null}

          {!loading && error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {!loading && !error && latestRequest ? (
            <div className="space-y-3 rounded-xl border border-orange-200 bg-orange-50/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Latest {requesterLabel} message</div>
                  <div className="text-xs text-slate-500">
                    {submittedAt ? `Submitted on ${submittedAt}` : 'Submission date unavailable'}
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full border border-orange-200 bg-white px-2.5 py-1 text-xs font-medium text-orange-700">
                  {requesterRole === 'MANAGEMENT' ? 'Waiting response' : 'Submitted'}
                </span>
              </div>

              <div className="rounded-lg border border-white/70 bg-white px-4 py-3 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
                {latestRequest.message}
              </div>
            </div>
          ) : null}

          {!loading && !error && !latestRequest ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
              No redo message is available for this contract.
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-10 px-4 border-slate-400 bg-white text-slate-700 hover:border-slate-500 hover:bg-slate-50"
            >
              Close
            </Button>
            {!loading && error ? (
              <Button
                variant="outline"
                onClick={() => {
                  setRequests([]);
                  setError('');
                  setLoading(true);
                  listRedoRequests(contract.id)
                    .then((response) => {
                      setRequests(Array.isArray(response?.data) ? response.data : []);
                    })
                    .catch((fetchError) => {
                      setError(fetchError?.response?.data?.message || 'Failed to load redo message');
                    })
                    .finally(() => {
                      setLoading(false);
                    });
                }}
                className="h-10 px-4 gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Retry
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}