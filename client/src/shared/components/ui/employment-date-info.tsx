import React from 'react';
import { Info } from 'lucide-react';
import { EmploymentDates } from '@/shared/hooks/useEmployeeEmploymentDates';
import { getDateConstraintMessage } from '@/lib/dateConstraints';

interface EmploymentDateInfoProps {
  employmentDates: EmploymentDates | null;
  className?: string;
}

export function EmploymentDateInfo({ employmentDates, className = '' }: EmploymentDateInfoProps) {
  const message = getDateConstraintMessage(employmentDates);

  if (!message) {
    return null;
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md flex items-start gap-2 ${className}`}>
      <Info className="w-4 h-4 mt-0.5 shrink-0" />
      <p className="text-sm">{message}</p>
    </div>
  );
}