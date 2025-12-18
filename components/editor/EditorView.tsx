'use client';

import { useState, useEffect } from 'react';
import { EditorQueueItem } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import SubtaskForm from './SubtaskForm';

export default function EditorView() {
  const [queueItems, setQueueItems] = useState<EditorQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptedItem, setAcceptedItem] = useState<EditorQueueItem | null>(null);

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/queue/editor');
      const result = await response.json();

      if (result.success) {
        setQueueItems(result.data);
      }
    } catch (error) {
      console.error('Error fetching editor queue:', error);
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
          <h2 className="text-3xl font-bold text-gray-900">Editor Dashboard</h2>
          <p className="text-gray-600">Complete your assigned subtask</p>
        </div>

        <SubtaskForm
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
        <h2 className="text-3xl font-bold text-gray-900">Editor Dashboard</h2>
        <p className="text-gray-600">Subtask queue - FIFO across all pipelines</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading queue...</p>
        </div>
      ) : queueItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No subtasks in queue</p>
          <p className="text-sm text-gray-500 mt-2">
            All subtasks have been completed or no active pipelines
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="border-2 border-blue-500 bg-blue-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">
                    NEXT IN QUEUE
                  </span>
                  {queueItems[0].rejectedFieldIds && queueItems[0].rejectedFieldIds.length > 0 && (
                    <span className="bg-orange-500 text-white px-2 py-1 rounded text-sm font-medium">
                      REVISION
                    </span>
                  )}
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
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">
                    Fields ({queueItems[0].fields.length}):
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {queueItems[0].fields.map((field) => {
                      const isRejected = queueItems[0].rejectedFieldIds?.includes(field.id);
                      const isAccepted =
                        !isRejected && queueItems[0].existingFieldValues?.[field.id];

                      return (
                        <li key={field.id} className="flex items-center gap-2">
                          <span>•</span>
                          <span>{field.label}</span>
                          <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                            {field.type === 'text' ? 'Text' : 'Long Text'}
                          </span>
                          {isRejected && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                              Needs revision
                            </span>
                          )}
                          {isAccepted && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              Accepted
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
              <div className="ml-4">
                <Button onClick={handleAcceptItem}>Accept Subtask</Button>
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
                          {item.rejectedFieldIds && item.rejectedFieldIds.length > 0 && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                              Revision
                            </span>
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900">{item.nodeLabel}</h4>
                        <p className="text-sm text-gray-600">{item.pipelineName}</p>
                        <p className="text-sm text-gray-500">
                          {item.fields.length} field{item.fields.length !== 1 ? 's' : ''}
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
