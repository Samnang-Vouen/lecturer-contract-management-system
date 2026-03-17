import React from 'react';
import AdvisorBasicsSection from './AdvisorBasicsSection';
import AdvisorResponsibilitiesSection from './AdvisorResponsibilitiesSection';
import AdvisorStudentsSection from './AdvisorStudentsSection';
import RedoEditDateFields from './RedoEditDateFields';
import RedoEditDialogActions from './RedoEditDialogActions';
import SimpleStringListEditor from './SimpleStringListEditor';

export default function AdvisorRedoForm(props) {
  return (
    <div className="space-y-6">
      <RedoEditDateFields
        startDate={props.startDate}
        setStartDate={props.setStartDate}
        endDate={props.endDate}
        setEndDate={props.setEndDate}
        errors={props.errors}
      />
      <AdvisorBasicsSection {...props} />
      <AdvisorResponsibilitiesSection {...props} />
      <AdvisorStudentsSection {...props} />
      <SimpleStringListEditor
        title="Duties"
        error={props.errors.duties}
        inputValue={props.dutyInput}
        onInputChange={(value) => props.setDutyInput(value)}
        onAdd={props.addDuty}
        items={props.duties}
        onRemove={(idx) => props.setDuties((prev) => (prev || []).filter((_, itemIdx) => itemIdx !== idx))}
        placeholder="Add a duty"
      />
      <RedoEditDialogActions onCancel={() => props.onOpenChange(false)} onSubmit={props.handleSubmit} canSubmit={props.canSubmit} saving={props.saving} />
    </div>
  );
}