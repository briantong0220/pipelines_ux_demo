'use client';

import { useState } from 'react';
import { EditorQueueItem, AccumulatedField, TaskField } from '@/types';
import Button from '@/components/ui/Button';

interface SubtaskFormProps {
  queueItem: EditorQueueItem;
  onSubmitted: () => void;
  onCancel: () => void;
}

interface DynamicFieldInputProps {
  field: TaskField;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  isRejected?: boolean;
}

type DynamicEntry = Record<string, string>;

function DynamicFieldInput({ field, value, onChange, disabled, isRejected }: DynamicFieldInputProps) {
  const subfields = field.subfields || [];
  const hasSubfields = subfields.length > 0;

  const createEmptyEntry = (): DynamicEntry => {
    if (hasSubfields) {
      const entry: DynamicEntry = {};
      subfields.forEach(sf => { entry[sf.id] = ''; });
      return entry;
    }
    return { _value: '' };
  };

  const parseEntries = (val: string): DynamicEntry[] => {
    if (!val) return [createEmptyEntry()];
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (typeof parsed[0] === 'string') {
          return parsed.map((s: string) => ({ _value: s }));
        }
        return parsed;
      }
      return [createEmptyEntry()];
    } catch {
      return val ? [{ _value: val }] : [createEmptyEntry()];
    }
  };

  const entries = parseEntries(value);

  const updateEntries = (newEntries: DynamicEntry[]) => {
    onChange(JSON.stringify(newEntries));
  };

  const handleSubfieldChange = (entryIndex: number, subfieldId: string, newValue: string) => {
    const newEntries = [...entries];
    newEntries[entryIndex] = { ...newEntries[entryIndex], [subfieldId]: newValue };
    updateEntries(newEntries);
  };

  const handleAddEntry = () => {
    updateEntries([...entries, createEmptyEntry()]);
  };

  const handleRemoveEntry = (index: number) => {
    if (entries.length <= 1) return;
    const newEntries = entries.filter((_, i) => i !== index);
    updateEntries(newEntries);
  };

  if (!hasSubfields) {
    return (
      <div className="space-y-2">
        {entries.map((entry, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={entry._value || ''}
              onChange={(e) => handleSubfieldChange(index, '_value', e.target.value)}
              disabled={disabled}
              className={`
                flex-1 px-4 py-3 border-2 rounded-lg transition-colors
                focus:outline-none focus:ring-0
                ${isRejected
                  ? 'border-red-300 focus:border-red-500 bg-red-50'
                  : disabled
                    ? 'border-green-200 bg-green-50 text-gray-500'
                    : 'border-gray-200 focus:border-blue-500'
                }
              `}
              placeholder={`Entry ${index + 1}`}
            />
            {!disabled && entries.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveEntry(index)}
                className="p-3 border-2 border-gray-200 rounded-lg text-gray-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        ))}
        {!disabled && (
          <button
            type="button"
            onClick={handleAddEntry}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add entry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, entryIndex) => (
        <div
          key={entryIndex}
          className={`
            border-2 rounded-lg p-4 transition-colors
            ${isRejected
              ? 'border-red-200 bg-red-50'
              : disabled
                ? 'border-green-200 bg-green-50'
                : 'border-gray-200 bg-gray-50'
            }
          `}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Entry {entryIndex + 1}
            </span>
            {!disabled && entries.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveEntry(entryIndex)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
          <div className="space-y-3">
            {subfields.map((subfield) => (
              <div key={subfield.id}>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  {subfield.label || 'Untitled'}
                </label>
                {subfield.type === 'text' ? (
                  <input
                    type="text"
                    value={entry[subfield.id] || ''}
                    onChange={(e) => handleSubfieldChange(entryIndex, subfield.id, e.target.value)}
                    disabled={disabled}
                    className={`
                      w-full px-3 py-2 border-2 rounded-lg transition-colors text-sm
                      focus:outline-none focus:ring-0
                      ${disabled
                        ? 'border-green-200 bg-green-100 text-gray-500'
                        : 'border-gray-200 bg-white focus:border-blue-500'
                      }
                    `}
                    placeholder={`Enter ${(subfield.label || 'value').toLowerCase()}...`}
                  />
                ) : (
                  <textarea
                    value={entry[subfield.id] || ''}
                    onChange={(e) => handleSubfieldChange(entryIndex, subfield.id, e.target.value)}
                    disabled={disabled}
                    rows={3}
                    className={`
                      w-full px-3 py-2 border-2 rounded-lg transition-colors text-sm resize-none
                      focus:outline-none focus:ring-0
                      ${disabled
                        ? 'border-green-200 bg-green-100 text-gray-500'
                        : 'border-gray-200 bg-white focus:border-blue-500'
                      }
                    `}
                    placeholder={`Enter ${(subfield.label || 'value').toLowerCase()}...`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          onClick={handleAddEntry}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add entry
        </button>
      )}
    </div>
  );
}

// Group accumulated fields by their source node
function groupFieldsByNode(fields: AccumulatedField[]): Map<string, AccumulatedField[]> {
  const grouped = new Map<string, AccumulatedField[]>();
  for (const field of fields) {
    const existing = grouped.get(field.nodeId) || [];
    existing.push(field);
    grouped.set(field.nodeId, existing);
  }
  return grouped;
}

export default function SubtaskForm({ queueItem, onSubmitted, onCancel }: SubtaskFormProps) {
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(
    queueItem.existingFieldValues || {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (fieldId: string, value: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/executions/${queueItem.executionId}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: queueItem.nodeId,
          type: 'subtask',
          data: { fieldValues },
        }),
      });

      const result = await response.json();
      if (result.success) {
        onSubmitted();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error submitting subtask:', error);
      alert('Failed to submit subtask');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRevision = queueItem.rejectedFieldIds && queueItem.rejectedFieldIds.length > 0;

  // Separate instruction fields from editable fields
  const instructionFields = queueItem.fields.filter(f => f.type === 'instructions');
  const editableFields = queueItem.fields.filter(f => f.type !== 'instructions');

  const isFieldFilled = (field: TaskField): boolean => {
    const value = fieldValues[field.id];
    if (!value) return false;
    
    if (field.type === 'dynamic') {
      try {
        const entries = JSON.parse(value);
        if (!Array.isArray(entries) || entries.length === 0) return false;
        
        const subfields = field.subfields || [];
        if (subfields.length > 0) {
          return entries.some((entry: Record<string, string>) => 
            subfields.some(sf => entry[sf.id]?.trim())
          );
        }
        
        if (typeof entries[0] === 'string') {
          return entries.some((e: string) => e?.trim());
        }
        return entries.some((e: Record<string, string>) => e._value?.trim());
      } catch {
        return value.trim().length > 0;
      }
    }
    return value.trim().length > 0;
  };

  const allFieldsFilled = editableFields.every(isFieldFilled);
  const groupedAccumulatedFields = queueItem.accumulatedFields
    ? groupFieldsByNode(queueItem.accumulatedFields)
    : null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-white">{queueItem.nodeLabel}</h1>
                {isRevision && (
                  <span className="bg-orange-400 text-white px-2 py-0.5 rounded text-xs font-medium">
                    Revision
                  </span>
                )}
              </div>
              <p className="text-blue-100 text-sm">{queueItem.pipelineName}</p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="text-blue-100 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {isRevision && (
          <div className="px-6 py-3 bg-orange-50 border-b border-orange-100">
            <p className="text-sm text-orange-800">
              <strong>Revision needed:</strong> Please update the highlighted fields based on reviewer feedback.
            </p>
          </div>
        )}

        {/* Progress indicator */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {editableFields.length} field{editableFields.length !== 1 ? 's' : ''} to complete
            </span>
            <span className="text-gray-500">
              {Object.keys(fieldValues).filter(k => fieldValues[k]?.trim()).length} / {editableFields.length} filled
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Previous responses (collapsed by default) */}
        {groupedAccumulatedFields && groupedAccumulatedFields.size > 0 && (
          <details className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <summary className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium text-gray-700">
                Previous responses ({Array.from(groupedAccumulatedFields.values()).flat().length} fields)
              </span>
            </summary>
            <div className="px-6 pb-4 space-y-4">
              {Array.from(groupedAccumulatedFields.entries()).map(([nodeId, fields]) => (
                <div key={nodeId} className="border-l-2 border-blue-200 pl-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {fields[0].nodeLabel}
                  </p>
                  {fields.map((field) => {
                    let displayValue: React.ReactNode = field.value;
                    if (field.value) {
                      try {
                        const parsed = JSON.parse(field.value);
                        if (Array.isArray(parsed)) {
                          if (typeof parsed[0] === 'string') {
                            displayValue = (
                              <div className="space-y-1">
                                {parsed.map((entry: string, idx: number) => (
                                  <div key={idx} className="flex items-start gap-2">
                                    <span className="text-xs text-gray-400">{idx + 1}.</span>
                                    <span>{entry || <span className="italic text-gray-400">Empty</span>}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          } else {
                            displayValue = (
                              <div className="space-y-2">
                                {parsed.map((entry: Record<string, string>, idx: number) => (
                                  <div key={idx} className="border-l-2 border-gray-300 pl-2">
                                    <span className="text-xs text-gray-400">Entry {idx + 1}</span>
                                    <div className="space-y-1 mt-1">
                                      {Object.entries(entry).map(([key, val]) => (
                                        <div key={key} className="text-xs">
                                          <span className="text-gray-500">{key === '_value' ? 'Value' : key}:</span>{' '}
                                          <span>{val || <span className="italic text-gray-400">Empty</span>}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                        }
                      } catch {
                        displayValue = field.value;
                      }
                    }
                    return (
                      <div key={field.fieldId} className="mb-3 last:mb-0">
                        <p className="text-xs text-gray-500 mb-1">{field.fieldLabel}</p>
                        <div className="text-sm text-gray-700 bg-gray-50 rounded px-3 py-2">
                          {displayValue || <span className="italic text-gray-400">Empty</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Main form card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Instructions */}
          {instructionFields.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              {instructionFields.map((field, idx) => (
                <p key={field.id} className={`text-sm text-gray-600 ${idx > 0 ? 'mt-2' : ''}`}>
                  {field.label}
                </p>
              ))}
            </div>
          )}

          {/* Fields */}
          <div className="p-6 space-y-6">
            {editableFields.map((field) => {
              const isRejected = queueItem.rejectedFieldIds?.includes(field.id);
              const isAccepted = !isRejected && Boolean(queueItem.existingFieldValues?.[field.id]);

              // Find review info for this field
              const fieldReview = queueItem.accumulatedFields?.find(
                f => f.fieldId === field.id
              );
              const rejectionComment = fieldReview?.reviewStatus === 'rejected' ? fieldReview.reviewComment : undefined;
              const acceptedComment = fieldReview?.reviewStatus === 'accepted' ? fieldReview.reviewComment : undefined;

              return (
                <div key={field.id}>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>

                  {isRejected && rejectionComment && (
                    <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        <strong>Feedback:</strong> {rejectionComment}
                      </p>
                    </div>
                  )}

                  {field.type === 'dynamic' ? (
                    <DynamicFieldInput
                      field={field}
                      value={fieldValues[field.id] || ''}
                      onChange={(value) => handleFieldChange(field.id, value)}
                      disabled={isAccepted}
                      isRejected={isRejected}
                    />
                  ) : field.type === 'file' ? (
                    <FileFieldInput
                      field={field}
                      value={fieldValues[field.id] || ''}
                      onChange={(value) => handleFieldChange(field.id, value)}
                      disabled={isAccepted}
                      isRejected={isRejected}
                    />
                  ) : field.type === 'text' ? (
                    <input
                      type="text"
                      value={fieldValues[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      disabled={isAccepted}
                      className={`
                        w-full px-4 py-3 border-2 rounded-lg transition-colors
                        focus:outline-none focus:ring-0
                        ${isRejected
                          ? 'border-red-300 focus:border-red-500 bg-red-50'
                          : isAccepted
                            ? 'border-green-200 bg-green-50 text-gray-500'
                            : 'border-gray-200 focus:border-blue-500'
                        }
                      `}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                      required={field.required}
                    />
                  ) : (
                    <textarea
                      value={fieldValues[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      disabled={isAccepted}
                      className={`
                        w-full px-4 py-3 border-2 rounded-lg transition-colors resize-none
                        focus:outline-none focus:ring-0
                        ${isRejected
                          ? 'border-red-300 focus:border-red-500 bg-red-50'
                          : isAccepted
                            ? 'border-green-200 bg-green-50 text-gray-500'
                            : 'border-gray-200 focus:border-blue-500'
                        }
                      `}
                      rows={5}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                      required={field.required}
                    />
                  )}

                  {/* Accepted status - subtle indicator below the field */}
                  {isAccepted && (
                    <div className="mt-2 flex items-start gap-2">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div className="text-sm text-green-700">
                        <span className="font-medium">Approved by reviewer</span>
                        {acceptedComment && (
                          <p className="text-green-600 mt-0.5">&ldquo;{acceptedComment}&rdquo;</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={!allFieldsFilled || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : isRevision ? 'Submit Revision' : 'Submit'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
