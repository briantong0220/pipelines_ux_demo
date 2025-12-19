'use client';

import { useState } from 'react';
import { ReviewerQueueItem, FieldReviewResult, AccumulatedField } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FieldReviewItem from './FieldReviewItem';

// Helper component to render field values, including dynamic fields
function FieldValueDisplay({ value }: { value: string }) {
  if (!value) {
    return <span className="text-gray-400 italic">No response</span>;
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      if (typeof parsed[0] === 'string') {
        return (
          <div className="space-y-1">
            {parsed.map((entry: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-xs text-gray-400">{idx + 1}.</span>
                <span>{entry || <span className="text-gray-400 italic">Empty</span>}</span>
              </div>
            ))}
          </div>
        );
      }

      return (
        <div className="space-y-2">
          {parsed.map((entry: Record<string, string>, idx: number) => (
            <div key={idx} className="border-l-2 border-gray-300 pl-2">
              <span className="text-xs text-gray-400">Entry {idx + 1}</span>
              <div className="mt-1 space-y-1">
                {Object.entries(entry).map(([key, val]) => (
                  <div key={key} className="text-xs">
                    <span className="text-gray-500">{key === '_value' ? 'Value' : key}:</span>{' '}
                    <span>{val || <span className="text-gray-400 italic">Empty</span>}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }
  } catch {
    // Not JSON, display as plain text
  }

  return <span>{value}</span>;
}

interface SubtaskReviewFormProps {
  queueItem: ReviewerQueueItem;
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

export default function SubtaskReviewForm({
  queueItem,
  onSubmitted,
  onCancel,
}: SubtaskReviewFormProps) {
  const [fieldReviews, setFieldReviews] = useState<Map<string, FieldReviewResult>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldAccept = (fieldId: string, comment: string) => {
    setFieldReviews((prev) => {
      const updated = new Map(prev);
      updated.set(fieldId, {
        fieldId,
        status: 'accepted',
        comment,
      });
      return updated;
    });
  };

  const handleFieldReject = (fieldId: string, comment: string) => {
    setFieldReviews((prev) => {
      const updated = new Map(prev);
      updated.set(fieldId, {
        fieldId,
        status: 'rejected',
        comment,
      });
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if all fields have been reviewed
    if (fieldReviews.size !== queueItem.fieldsToReview.length) {
      alert('Please review all fields before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/executions/${queueItem.executionId}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: queueItem.nodeId,
          type: 'review',
          data: {
            fieldReviews: Array.from(fieldReviews.values()),
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        onSubmitted();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const reviewedCount = fieldReviews.size;
  const totalCount = queueItem.fieldsToReview.length;
  const acceptedCount = Array.from(fieldReviews.values()).filter((r) => r.status === 'accepted')
    .length;
  const rejectedCount = Array.from(fieldReviews.values()).filter((r) => r.status === 'rejected')
    .length;
  const allReviewed = reviewedCount === totalCount;
  const groupedAccumulatedFields = queueItem.accumulatedFields
    ? groupFieldsByNode(queueItem.accumulatedFields)
    : null;

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{queueItem.nodeLabel}</h3>
          <p className="text-gray-600">
            Pipeline: <span className="font-medium">{queueItem.pipelineName}</span>
          </p>
        </div>

        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded">
          <p className="text-sm text-purple-900 mb-2">
            <strong>Review Progress:</strong> {reviewedCount} of {totalCount} fields reviewed
          </p>
          <div className="flex gap-4 text-xs text-purple-800">
            <div>
              <span className="font-medium">{acceptedCount}</span> accepted
            </div>
            <div>
              <span className="font-medium">{rejectedCount}</span> rejected
            </div>
          </div>
        </div>

        {/* Accumulated fields from previous subtasks */}
        {groupedAccumulatedFields && groupedAccumulatedFields.size > 0 && (
          <div className="mb-8">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Previous Task Responses
            </h4>
            <div className="space-y-4">
              {Array.from(groupedAccumulatedFields.entries()).map(([nodeId, fields]) => (
                <div key={nodeId} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    {fields[0].nodeLabel}
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      Reviewed
                    </span>
                  </h5>
                  <div className="space-y-3">
                    {fields.map((field) => (
                      <div key={field.fieldId} className="text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-600">{field.fieldLabel}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${field.reviewStatus === 'accepted'
                              ? 'bg-green-100 text-green-700'
                              : field.reviewStatus === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {field.reviewStatus}
                          </span>
                        </div>
                        <div className="bg-white border border-gray-200 rounded px-3 py-2 text-gray-700">
                          <FieldValueDisplay value={field.value} />
                        </div>
                        {field.reviewComment && (
                          <p className="mt-1 text-xs text-gray-500 italic">
                            Previous review: {field.reviewComment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current fields to review */}
        {groupedAccumulatedFields && groupedAccumulatedFields.size > 0 && (
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Fields to Review
          </h4>
        )}

        <div className="space-y-6">
          {queueItem.fieldsToReview.map((field) => (
            <FieldReviewItem
              key={field.fieldId}
              field={field}
              onAccept={handleFieldAccept}
              onReject={handleFieldReject}
              disabled={isSubmitting}
            />
          ))}
        </div>

        <div className="flex gap-3 mt-8">
          <Button
            type="submit"
            disabled={!allReviewed || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>

        {!allReviewed && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            You must review all fields before submitting
          </p>
        )}
      </Card>
    </form>
  );
}
