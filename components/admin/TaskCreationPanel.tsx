'use client';

import { useState } from 'react';
import { FieldType, TaskField } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Card from '@/components/ui/Card';

interface TaskCreationPanelProps {
  onClose: () => void;
  onTaskCreated: () => void;
}

interface FieldDraft extends Omit<TaskField, 'id'> {
  tempId: string;
}

export default function TaskCreationPanel({ onClose, onTaskCreated }: TaskCreationPanelProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FieldDraft[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addField = (type: FieldType) => {
    const newField: FieldDraft = {
      tempId: `temp-${Date.now()}`,
      label: '',
      type
    };
    setFields([...fields, newField]);
  };

  const updateField = (tempId: string, updates: Partial<FieldDraft>) => {
    setFields(fields.map(field =>
      field.tempId === tempId ? { ...field, ...updates } : field
    ));
  };

  const removeField = (tempId: string) => {
    setFields(fields.filter(field => field.tempId !== tempId));
  };

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    if (fields.length === 0) {
      setError('At least one field is required');
      return;
    }

    // Check all fields have labels
    const hasEmptyLabels = fields.some(field => !field.label.trim());
    if (hasEmptyLabels) {
      setError('All fields must have labels');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description.trim() || undefined,
          fields: fields.map(({ tempId, ...field }) => field)
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create task');
      }

      onTaskCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create New Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4">
          <Input
            label="Task Title"
            placeholder="Enter task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Textarea
            label="Description (optional)"
            placeholder="Enter task description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fields
            </label>

            <div className="space-y-3 mb-4">
              {fields.map((field, index) => (
                <div key={field.tempId} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      placeholder="Field label"
                      value={field.label}
                      onChange={(e) => updateField(field.tempId, { label: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 min-w-[80px]">
                      {field.type === 'text' ? 'Text' : 'Long Text'}
                    </span>
                    <button
                      onClick={() => removeField(field.tempId)}
                      className="text-red-600 hover:text-red-800 font-bold text-xl"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => addField('text')}>
                Add Text Field
              </Button>
              <Button variant="secondary" onClick={() => addField('longtext')}>
                Add Long Text Field
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
