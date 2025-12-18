'use client';

import { TaskField } from '@/types';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';

interface FieldInputProps {
  field: TaskField;
  value: string;
  onChange: (value: string) => void;
}

export default function FieldInput({ field, value, onChange }: FieldInputProps) {
  if (field.type === 'longtext') {
    return (
      <Textarea
        label={field.label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your response"
      />
    );
  }

  return (
    <Input
      label={field.label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter your response"
    />
  );
}
