'use client';

import { useState } from 'react';
import { EditorQueueItem, AccumulatedField } from '@/types';
import Button from '@/components/ui/Button';

interface SubtaskFormProps {
  queueItem: EditorQueueItem;
  onSubmitted: () => void;
  onCancel: () => void;
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

  // Only check editable fields for completion
  const allFieldsFilled = editableFields.every((field) => fieldValues[field.id]?.trim());
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
                  {fields.map((field) => (
                    <div key={field.fieldId} className="mb-3 last:mb-0">
                      <p className="text-xs text-gray-500 mb-1">{field.fieldLabel}</p>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded px-3 py-2">
                        {field.value || <span className="italic text-gray-400">Empty</span>}
                      </p>
                    </div>
                  ))}
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

                  {field.type === 'text' ? (
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
