import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Input from '../../ui/Input';
import FileUploadBox from './FileUploadBox';
import { 
  filterToKhmer, 
  formatAccountNumber, 
  sanitizeEnglishUpper,
  digitsOnlyPattern 
} from '../../../utils/inputValidation';
import { toTitleCase } from '../../../utils/nameFormatting';

/**
 * Step 1: Basic Information
 */
export default function OnboardingBasicInfo({ formData, updateForm, files, handleFileUpload }) {
  const [showBankOptions, setShowBankOptions] = useState(false);

  const handleKhmerNameChange = (e) => {
    updateForm('khmerName', filterToKhmer(e.target.value));
  };

  const handleKhmerNamePaste = (e) => {
    const pasted = (e.clipboardData || window.clipboardData).getData('text') || '';
    const filtered = filterToKhmer(pasted);
    e.preventDefault();
    updateForm('khmerName', (formData.khmerName || '') + filtered);
  };

  const handleAccountChange = (e) => {
    updateForm('accountName', formatAccountNumber(e.target.value));
  };

  const handleAccountPaste = (e) => {
    const pasted = (e.clipboardData || window.clipboardData).getData('text') || '';
    const pastedDigits = String(pasted).replace(digitsOnlyPattern, '');
    e.preventDefault();
    const existingDigits = (formData.accountName || '').replace(digitsOnlyPattern, '');
    const combined = (existingDigits + pastedDigits).slice(0, 16);
    updateForm('accountName', combined.replace(/(\d{4})(?=\d)/g, '$1 ').trim());
  };

  const handleAccountHolderChange = (e) => {
    updateForm('accountHolderName', sanitizeEnglishUpper(e.target.value));
  };

  const handleAccountHolderPaste = (e) => {
    const pasted = (e.clipboardData || window.clipboardData).getData('text') || '';
    e.preventDefault();
    updateForm('accountHolderName', sanitizeEnglishUpper(pasted));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            English Name <span className="text-red-500" aria-hidden="true">*</span>
            <span className="sr-only"> required</span>
          </label>
          <Input
            value={formData.englishName}
            onChange={(e) => updateForm('englishName', e.target.value)}
            onBlur={() => updateForm('englishName', toTitleCase(formData.englishName))}
            placeholder="Chan Dara"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Khmer Name <span className="text-red-500" aria-hidden="true">*</span>
            <span className="sr-only"> required</span>
          </label>
          <Input
            value={formData.khmerName}
            onChange={handleKhmerNameChange}
            onPaste={handleKhmerNamePaste}
            placeholder="ចាន់ ដារ៉ា"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Account Number <span className="text-red-500" aria-hidden="true">*</span>
            <span className="sr-only"> required</span>
          </label>
          <Input
            value={formData.accountName}
            onChange={handleAccountChange}
            onPaste={handleAccountPaste}
            placeholder="XXXX XXXX XXXX XXXX"
            required
            inputMode="numeric"
            maxLength={19}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2 relative">
          <label className="block text-sm font-semibold text-gray-700">
            Bank Name <span className="text-red-500" aria-hidden="true">*</span>
            <span className="sr-only"> required</span>
          </label>
          <div className="relative">
            <Input
              value={formData.bankName}
              readOnly
              placeholder="Select a bank"
              required
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
              onClick={() => setShowBankOptions(!showBankOptions)}
            />
            <button
              type="button"
              onClick={() => setShowBankOptions(!showBankOptions)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-transform duration-200"
              style={{
                transform: `translateY(-50%) ${showBankOptions ? 'rotate(180deg)' : 'rotate(0deg)'}`
              }}
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
          {showBankOptions && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1">
              <div className="grid grid-cols-1 gap-2 p-3 border border-gray-200 rounded-md bg-white shadow-lg">
                {["ACLEDA Bank"].map((bank) => (
                  <button
                    key={bank}
                    type="button"
                    onClick={() => {
                      updateForm('bankName', bank);
                      setShowBankOptions(false);
                    }}
                    className={`p-3 text-sm border rounded-md transition-all duration-200 text-left ${
                      formData.bankName === bank
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {bank}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700">
            Account Holder Name <span className="text-red-500" aria-hidden="true">*</span>
            <span className="sr-only"> required</span>
          </label>
          <Input
            value={formData.accountHolderName}
            onChange={handleAccountHolderChange}
            onPaste={handleAccountHolderPaste}
            placeholder="Enter account holder name as it appears on bank records"
            required
            pattern="[A-Za-z\s]+"
            title="Use English letters and spaces only"
            inputMode="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <FileUploadBox
            file={files.payrollFile}
            onFileSelect={(file) => handleFileUpload(file, "payroll")}
            accept=".pdf,image/*"
            label="Payroll Document (PDF or image)"
            description="PDF or image files only"
            required
            id="payroll-upload"
          />
        </div>
      </div>
    </div>
  );
}
