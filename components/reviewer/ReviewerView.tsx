'use client';

import { useState, useEffect } from 'react';
import { ReviewerQueueItem } from '@/types';
import Button from '@/components/ui/Button';
import SubtaskReviewForm from './SubtaskReviewForm';

export default function ReviewerView() {
  const [queueItems, setQueueItems] = useState<ReviewerQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptedItem, setAcceptedItem] = useState<ReviewerQueueItem | null>(null);

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/queue/reviewer');
      const result = await response.json();

      if (result.success) {
        setQueueItems(result.data);
      }
    } catch (error) {
      console.error('Error fetching reviewer queue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAcceptItem = () => {
    if (queueItems.length > 0) {
      setAcceptedItem(queueItems[0]);
    }
  };

  const handleSubmitted = () => {
    setAcceptedItem(null);
    fetchQueue();
  };

  const handleCancel = () => {
    setAcceptedItem(null);
  };

  if (acceptedItem) {
    return (
      <div className="max-w-3xl mx-auto">
        <SubtaskReviewForm
          queueItem={acceptedItem}
          onSubmitted={handleSubmitted}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  const revisionsCount = queueItems.filter(q =>
    q.fieldsToReview.some(f => f.version > 1)
  ).length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Review Queue</h1>
        <p className="text-gray-500">Review submitted work in order</p>
      </div>

      {/* Stats */}
      {!isLoading && queueItems.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-3xl font-bold text-purple-600">{queueItems.length}</p>
            <p className="text-sm text-gray-500">Pending Review</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-3xl font-bold text-orange-500">{revisionsCount}</p>
            <p className="text-sm text-gray-500">Resubmissions</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-3xl font-bold text-gray-600">
              {queueItems.reduce((acc, q) => acc + q.fieldsToReview.length, 0)}
            </p>
            <p className="text-sm text-gray-500">Total Fields</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-200 rounded-full mb-4" />
            <div className="h-4 bg-gray-200 rounded w-32" />
          </div>
        </div>
      ) : queueItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">All reviewed!</h3>
          <p className="text-gray-500">No submissions waiting for review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Next Review - Featured Card */}
          <div className="bg-white rounded-xl border-2 border-purple-500 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-white font-medium">Next Review</span>
                {queueItems[0].fieldsToReview.some(f => f.version > 1) && (
                  <span className="bg-orange-400 text-white px-2 py-0.5 rounded text-xs font-medium">
                    Resubmission
                  </span>
                )}
              </div>
              <span className="text-purple-100 text-sm">1 of {queueItems.length}</span>
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {queueItems[0].nodeLabel}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {queueItems[0].pipelineName}
                  </p>

                  {/* Fields preview */}
                  <div className="space-y-3">
                    {queueItems[0].fieldsToReview.slice(0, 3).map((field) => (
                      <div key={field.fieldId} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.fieldLabel}</span>
                          {field.version > 1 && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                              v{field.version}
                            </span>
                          )}
                        </div>
                        <div className="px-3 py-2">
                          <p className="text-sm text-gray-900 line-clamp-2">
                            {field.currentValue || <span className="italic text-gray-400">Empty</span>}
                          </p>
                        </div>
                      </div>
                    ))}
                    {queueItems[0].fieldsToReview.length > 3 && (
                      <p className="text-sm text-gray-500 pl-1">
                        +{queueItems[0].fieldsToReview.length - 3} more field{queueItems[0].fieldsToReview.length - 3 !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>

                <Button onClick={handleAcceptItem} className="ml-4 shrink-0">
                  Start Review
                </Button>
              </div>
            </div>
          </div>

          {/* Remaining Queue */}
          {queueItems.length > 1 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-medium text-gray-700">
                  Up Next ({queueItems.length - 1})
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {queueItems.slice(1).map((item, index) => {
                  const hasResubmission = item.fieldsToReview.some(f => f.version > 1);
                  return (
                    <div
                      key={`${item.executionId}-${item.nodeId}`}
                      className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-500">
                          {index + 2}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{item.nodeLabel}</h4>
                            {hasResubmission && (
                              <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                                Resubmission
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{item.pipelineName}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">
                        {item.fieldsToReview.length} field{item.fieldsToReview.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
