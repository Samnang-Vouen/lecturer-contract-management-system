import React from 'react';
import EditableStringListEditor from './EditableStringListEditor';
import RedoEditDateFields from './RedoEditDateFields';
import RedoEditDialogActions from './RedoEditDialogActions';
import TeachingCoursesSection from './TeachingCoursesSection';

export default function TeachingRedoForm(props) {
  return (
    <div className="space-y-6">
      <RedoEditDateFields
        startDate={props.startDate}
        setStartDate={props.setStartDate}
        endDate={props.endDate}
        setEndDate={props.setEndDate}
        errors={props.errors}
      />
      <TeachingCoursesSection {...props} />
      <EditableStringListEditor
        title="Duties"
        error={props.errors.items}
        inputValue={props.itemInput}
        onInputChange={(value) => props.setItemInput(value)}
        onAdd={props.addItem}
        items={props.items}
        editingItemIdx={props.editingItemIdx}
        editingItemValue={props.editingItemValue}
        onEditingItemValueChange={props.setEditingItemValue}
        onStartEdit={props.startEditItem}
        onCommitEdit={props.commitEditItem}
        onRemove={props.removeItem}
        placeholder="Add a duty"
      />
      <RedoEditDialogActions onCancel={() => props.onOpenChange(false)} onSubmit={props.handleSubmit} canSubmit={props.canSubmit} saving={props.saving} />
    </div>
  );
}