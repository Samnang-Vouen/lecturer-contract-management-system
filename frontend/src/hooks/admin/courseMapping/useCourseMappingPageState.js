import { useState } from 'react';
import { createInitialCourseMappingForm } from './courseMappingPage.form';

export function useCourseMappingPageState() {
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [addError, setAddError] = useState('');
  const [editError, setEditError] = useState('');
  const [form, setForm] = useState(createInitialCourseMappingForm);

  return {
    addOpen, setAddOpen, editOpen, setEditOpen, editing, setEditing,
    confirmOpen, setConfirmOpen, toDelete, setToDelete, deleting, setDeleting,
    addError, setAddError, editError, setEditError, form, setForm,
  };
}