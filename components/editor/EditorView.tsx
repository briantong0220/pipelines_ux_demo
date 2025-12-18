'use client';

import { useState, useEffect } from 'react';
import { EditorQueueItem } from '@/types';
import Button from '@/components/ui/Button';
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
      <SubtaskForm
        queueItem={acceptedItem}
        onSubmitted={handleSubmitted}
        onCancel={handleCancel}
      />
    );
  }

  const revisionCount = queueItems.filter(q => q.rejectedFieldIds && q.rejectedFieldIds.length > 0).length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Editor Queue</h1>
        <p className="text-gray-500">Complete subtasks in order</p>
      </div>

      {/* Stats */}
      {!isLoading && queueItems.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-3xl font-bold text-blue-600">{queueItems.length}</p>
            <p className="text-sm text-gray-500">In Queue</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-3xl font-bold text-orange-500">{revisionCount}</p>
            <p className="text-sm text-gray-500">Need Revision</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-3xl font-bold text-green-600">{queueItems.length - revisionCount}</p>
            <p className="text-sm text-gray-500">New Tasks</p>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">All caught up!</h3>
          <p className="text-gray-500">No subtasks waiting in your queue</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Next Task - Featured Card */}
          <div className="bg-white rounded-xl border-2 border-blue-500 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-white font-medium">Next Task</span>
                {queueItems[0].rejectedFieldIds && queueItems[0].rejectedFieldIds.length > 0 && (
                  <span className="bg-orange-400 text-white px-2 py-0.5 rounded text-xs font-medium">
                    Revision
                  </span>
                )}
              </div>
              <span className="text-blue-100 text-sm">1 of {queueItems.length}</span>
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
                  <div className="flex flex-wrap gap-2">
                    {queueItems[0].fields.filter(f => f.type !== 'instructions').map((field) => {
                      const isRejected = queueItems[0].rejectedFieldIds?.includes(field.id);
                      const isAccepted = !isRejected && queueItems[0].existingFieldValues?.[field.id];

                      return (
                        <span
                          key={field.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${isRejected
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : isAccepted
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                          {isRejected && (
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          )}
                          {isAccepted && (
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          {field.label}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <Button onClick={handleAcceptItem} className="ml-4 shrink-0">
                  Start Task
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
                {queueItems.slice(1).map((item, index) => (
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
                          {item.rejectedFieldIds && item.rejectedFieldIds.length > 0 && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                              Revision
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{item.pipelineName}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {item.fields.filter(f => f.type !== 'instructions').length} fields
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
