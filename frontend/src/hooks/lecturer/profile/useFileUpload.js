import { useState } from 'react';
import toast from 'react-hot-toast';
import { uploadLecturerFiles } from '../../../services/lecturerProfile.service';

export function useFileUpload(setProfile) {
  const [fileUploading, setFileUploading] = useState(false);

  const uploadFiles = async (files) => {
    if (!files.cv && !files.syllabus) return;
    setFileUploading(true);
    try {
      const res = await uploadLecturerFiles({ cv: files.cv, syllabus: files.syllabus });
      setProfile(res?.profile || res);
      toast.success('Files uploaded');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Upload failed');
    } finally {
      setFileUploading(false);
    }
  };

  return {
    fileUploading,
    uploadFiles
  };
}
