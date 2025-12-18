'use client';

import { useState, useEffect } from 'react';
import { ReviewerQueueItem } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
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
      <div>
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Reviewer Dashboard</h2>
          <p className="text-gray-600">Review submitted subtask</p>
        </div>

        <SubtaskReviewForm
          queueItem={acceptedItem}
          onSubmitted={handleSubmitted}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Reviewer Dashboard</h2>
        <p className="text-gray-600">Review queue - FIFO across all pipelines</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading queue...</p>
        </div>
      ) : queueItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No reviews in queue</p>
          <p className="text-sm text-gray-500 mt-2">
            All subtasks have been reviewed or no pending reviews
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="border-2 border-purple-500 bg-purple-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-purple-600 text-white px-2 py-1 rounded text-sm font-medium">
                    NEXT IN QUEUE
                  </span>
                  <span className="text-sm text-gray-600">
                    Position 1 of {queueItems.length}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {queueItems[0].nodeLabel}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Pipeline: <span className="font-medium">{queueItems[0].pipelineName}</span>
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700">Fields to review:</span>
                    <span className="text-gray-600">
                      {queueItems[0].fieldsToReview.length}
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Field preview:
                    </p>
                    <div className="space-y-1">
                      {queueItems[0].fieldsToReview.slice(0, 2).map((field) => {
                        return (
                          <div key={field.fieldId} className="text-sm">
                            <span className="font-medium text-gray-700">{field.fieldLabel}:</span>
                            <span className="text-gray-600 ml-2">
                              {field.currentValue.substring(0, 50)}
                              {field.currentValue.length > 50 ? '...' : ''}
                            </span>
                            {field.version > 1 && (
                              <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-1 py-0.5 rounded">
                                v{field.version}
                              </span>
                            )}
                          </div>
                        );
                      })}
                      {queueItems[0].fieldsToReview.length > 2 && (
                        <p className="text-xs text-gray-500 italic">
                          ... and {queueItems[0].fieldsToReview.length - 2} more field
                          {queueItems[0].fieldsToReview.length - 2 !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="ml-4">
                <Button onClick={handleAcceptItem}>Accept Review</Button>
              </div>
            </div>
          </Card>

          {queueItems.length > 1 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Remaining in Queue ({queueItems.length - 1})
              </h3>
              <div className="space-y-3">
                {queueItems.slice(1).map((item, index) => (
                  <Card key={`${item.executionId}-${item.nodeId}`} className="bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-gray-500">Position {index + 2}</span>
                        </div>
                        <h4 className="font-medium text-gray-900">{item.nodeLabel}</h4>
                        <p className="text-sm text-gray-600">{item.pipelineName}</p>
                        <p className="text-sm text-gray-500">
                          {item.fieldsToReview.length} field
                          {item.fieldsToReview.length !== 1 ? 's' : ''} to review
                        </p>
                      </div>
                      <span className="text-gray-400 text-sm">Queued</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
