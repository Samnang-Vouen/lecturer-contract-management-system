import { useCallback } from 'react';
import { createAdvisorContract, editAdvisorContract } from '../../../services/advisorContract.service';
import { editTeachingContract } from '../../../services/contract.service';
import { buildAdvisorContractPayload, buildTeachingContractPayload, normalizeStatus } from './contractGenerationPage.helpers';

export function useContractGenerationHandlers({ academicYear, contractActions, refreshSingleAdvisorContract, fetchAllAdvisorContracts, contractData, setEditRedo }) {
  const handleCreateContract = useCallback(async (payload) => {
    const contractPayload = buildTeachingContractPayload(payload, academicYear);
    console.log('Sending contract payload:', contractPayload);
    await contractActions.createContract(contractPayload);
  }, [academicYear, contractActions]);

  const handleCreateAdvisorContract = useCallback(async (payload) => {
    const advisorPayload = buildAdvisorContractPayload(payload, academicYear);
    const created = await createAdvisorContract(advisorPayload);
    await refreshSingleAdvisorContract(created?.id);
  }, [academicYear, refreshSingleAdvisorContract]);

  const handleOpenRedoEdit = useCallback((contract) => {
    if (normalizeStatus(contract?.status) !== 'REQUEST_REDO') return;
    setEditRedo({ open: true, contract });
  }, [setEditRedo]);

  const handleSaveRedoEdit = useCallback(async (contract, payload) => {
    if (!contract?.id) return;
    if (String(contract?.contract_type || '').toUpperCase() === 'ADVISOR') {
      await editAdvisorContract(contract.id, payload);
      await fetchAllAdvisorContracts();
      return;
    }
    await editTeachingContract(contract.id, payload);
    await contractData.refreshContracts();
  }, [contractData, fetchAllAdvisorContracts]);

  return {
    handleCreateContract,
    handleCreateAdvisorContract,
    handleOpenRedoEdit,
    handleSaveRedoEdit,
  };
}