import React from 'react';
import { Input } from '@/shared/components/ui/input';
import { EmploymentDates } from '@/shared/hooks/useEmployeeEmploymentDates';
import { getEmploymentDateConstraints, isDateWithinEmploymentPeriod } from '@/lib/dateConstraints';

interface ConstrainedDateInputProps {
  value: string;
  onChange: (value: string) => void;
  employmentDates: EmploymentDates | null;
  required?: boolean;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function ConstrainedDateInput({
  value,
  onChange,
  employmentDates,
  required = false,
  className = '',
  placeholder,
  disabled = false,
}: ConstrainedDateInputProps) {
  const dateConstraints = getEmploymentDateConstraints(employmentDates);

  // Check if current value is within employment period
  const isValidDate = !value || isDateWithinEmploymentPeriod(value, employmentDates);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Validate the new date before allowing the change
    if (newValue && !isDateWithinEmploymentPeriod(newValue, employmentDates)) {
      // Don't update if the date is outside employment period
      // The HTML min/max should prevent this, but this is a fallback
      return;
    }

    onChange(newValue);
  };

  return (
    <div className="space-y-1">
      <Input
        type="date"
        value={value}
        onChange={handleChange}
        min={dateConstraints.min}
        max={dateConstraints.max}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className={`${className} ${!isValidDate ? 'border-red-500 focus-visible:ring-red-500' : ''} constrained-date-input`}
      />
      {!isValidDate && value && (
        <p className="text-sm text-red-600">
          Date must be within your employment period
          {employmentDates?.hireDate && ` (from ${new Date(employmentDates.hireDate).toLocaleDateString()})`}
          {employmentDates?.terminationDate && ` (until ${new Date(employmentDates.terminationDate).toLocaleDateString()})`}
        </p>
      )}
    </div>
  );
}