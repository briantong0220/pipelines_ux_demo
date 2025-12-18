'use client';

import { useState } from 'react';
import { Task, ResponseField } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FieldInput from './FieldInput';

interface TaskResponseFormProps {
  task: Task;
  onSubmitted: () => void;
}

export default function TaskResponseForm({ task, onSubmitted }: TaskResponseFormProps) {
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateFieldValue = (fieldId: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async () => {
    setError(null);

    // Validate all fields have values
    const hasEmptyFields = task.fields.some(field => !fieldValues[field.id]?.trim());
    if (hasEmptyFields) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const fields: ResponseField[] = task.fields.map(field => ({
        fieldId: field.id,
        value: fieldValues[field.id]
      }));

      const response = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          fields
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit response');
      }

      setSuccess(true);
      setFieldValues({});
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{task.title}</h3>
      {task.description && (
        <p className="text-gray-600 mb-6">{task.description}</p>
      )}

      <div className="space-y-4">
        {task.fields.map(field => (
          <FieldInput
            key={field.id}
            field={field}
            value={fieldValues[field.id] || ''}
            onChange={(value) => updateFieldValue(field.id, value)}
          />
        ))}
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          Response submitted successfully!
        </div>
      )}

      <div className="mt-6">
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Response'}
        </Button>
      </div>
    </Card>
  );
}
