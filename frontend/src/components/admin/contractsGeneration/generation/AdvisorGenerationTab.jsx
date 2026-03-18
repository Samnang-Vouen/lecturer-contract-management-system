import React from 'react';
import Input from '../../../ui/Input';
import AdvisorBasicsSection from './AdvisorBasicsSection';
import AdvisorResponsibilitiesSection from './AdvisorResponsibilitiesSection';
import AdvisorStudentsSection from './AdvisorStudentsSection';
import GenerationDateField from './GenerationDateField';
import GenerationEditableList from './GenerationEditableList';

export default function AdvisorGenerationTab(props) {
  return (
    <>
      <AdvisorBasicsSection {...props} />
      <AdvisorResponsibilitiesSection {...props} />
      <AdvisorStudentsSection {...props} />
      <GenerationDateField label="Start Date" value={props.advStartDate} min={new Date().toISOString().slice(0, 10)} onChange={(value) => {
        props.setAdvStartDate(value);
        props.setAdvErrors((prev) => ({ ...prev, startDate: '' }));
      }} error={props.advErrors.startDate} />
      <GenerationDateField label="End Date" value={props.advEndDate} min={props.advStartDate || new Date().toISOString().slice(0, 10)} onChange={(value) => {
        props.setAdvEndDate(value);
        props.setAdvErrors((prev) => ({ ...prev, endDate: '' }));
      }} error={props.advErrors.endDate} />
      <GenerationEditableList
        label="Duties (Enter to add)"
        placeholder="Do course syllabus"
        inputValue={props.advDutyInput}
        setInputValue={(value) => {
          props.setAdvDutyInput(value);
          if (props.advErrors.duties) props.setAdvErrors((prev) => ({ ...prev, duties: '' }));
        }}
        items={props.advDuties}
        setItems={props.setAdvDuties}
        editingIdx={props.advEditingDutyIdx}
        setEditingIdx={props.setAdvEditingDutyIdx}
        editingValue={props.advEditingDutyValue}
        setEditingValue={props.setAdvEditingDutyValue}
        error={props.advErrors.duties}
      />
      <div className="space-y-1 mb-2">
        <label className="block text-sm font-medium">Join Judging</label>
        <Input className="w-full cursor-pointer h-11 text-base shadow-sm" inputMode="numeric" pattern="[0-9]*" value={props.advJoinJudgingHours} onChange={(e) => props.setAdvJoinJudgingHours(String(e.target.value || '').replace(/[^0-9]/g, ''))} placeholder="Number of hour for judging" />
      </div>
    </>
  );
}