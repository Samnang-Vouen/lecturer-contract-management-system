import React from 'react';
import GenerationDateField from './GenerationDateField';
import GenerationEditableList from './GenerationEditableList';
import LecturerBasicsSection from './LecturerBasicsSection';
import LecturerCourseSelectionSection from './LecturerCourseSelectionSection';

export default function LecturerGenerationTab(props) {
  return (
    <>
      <LecturerBasicsSection lecturers={props.lecturers} dlgLecturerKey={props.dlgLecturerKey} handleLecturerChange={props.handleLecturerChange} dlgErrors={props.dlgErrors} dlgHourlyRate={props.dlgHourlyRate} />
      <GenerationDateField label="Start Date" value={props.dlgStartDate} min={new Date().toISOString().slice(0, 10)} onChange={(value) => {
        props.setDlgStartDate(value);
        props.setDlgErrors((prev) => ({ ...prev, startDate: '' }));
      }} error={props.dlgErrors.startDate} />
      <GenerationDateField label="End Date" value={props.dlgEndDate} min={props.dlgStartDate || new Date().toISOString().slice(0, 10)} onChange={(value) => {
        props.setDlgEndDate(value);
        props.setDlgErrors((prev) => ({ ...prev, endDate: '' }));
      }} error={props.dlgErrors.endDate} />
      <GenerationEditableList
        label="Duties (press Enter to add)"
        placeholder="Type a duty and press Enter"
        inputValue={props.dlgItemInput}
        setInputValue={(value) => {
          props.setDlgItemInput(value);
          if (props.dlgErrors.description) props.setDlgErrors((prev) => ({ ...prev, description: '' }));
        }}
        items={props.dlgItems}
        setItems={props.setDlgItems}
        editingIdx={props.dlgEditingItemIdx}
        setEditingIdx={props.setDlgEditingItemIdx}
        editingValue={props.dlgEditingItemValue}
        setEditingValue={props.setDlgEditingItemValue}
        error={props.dlgErrors.description}
      />
      <LecturerCourseSelectionSection {...props} />
    </>
  );
}