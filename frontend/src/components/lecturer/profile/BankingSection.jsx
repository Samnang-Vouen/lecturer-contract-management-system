import React from 'react';
import { Card, CardContent } from '../../ui/Card';
import SectionHeader from './SectionHeader';
import FormField from './FormField';
import { Wallet } from 'lucide-react';

export default function BankingSection({ form, editMode, onChange }) {
  return (
    <Card className="shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 bg-white rounded-2xl border border-gray-100/70">
      <SectionHeader title="Banking" icon={<Wallet className="h-4 w-4" />} accent="purple" />
      <CardContent className="pt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField 
          name="bank_name" 
          label="Bank Name" 
          value={form.bank_name} 
          onChange={onChange} 
          disabled={!editMode} 
        />
        <FormField 
          name="account_name" 
          label="Account Name" 
          value={form.account_name} 
          onChange={onChange} 
          disabled={!editMode} 
        />
        <FormField 
          name="account_number" 
          label="Account Number" 
          value={form.account_number} 
          onChange={onChange} 
          disabled={!editMode} 
        />
      </CardContent>
    </Card>
  );
}
