'use client';

import { useState, useMemo, useEffect } from 'react';
import { ReviewNodeData, PipelineNode, PipelineEdge, SubtaskNodeData, TaskField } from '@/types';

interface ReviewNodeConfigProps {
  nodeId: string;
  data: ReviewNodeData;
  allNodes: PipelineNode[];
  allEdges: PipelineEdge[];
  onUpdate: (nodeId: string, data: ReviewNodeData) => void;
  onClose: () => void;
}

// Get all subtask fields that will be reviewed by this review node
function getSourceSubtaskFields(
  nodeId: string,
  nodes: PipelineNode[],
  edges: PipelineEdge[],
  sourceSubtaskNodeId: string
): { subtaskLabel: string; fields: TaskField[] } | null {
  if (sourceSubtaskNodeId) {
    const subtaskNode = nodes.find(n => n.id === sourceSubtaskNodeId && n.type === 'subtask');
    if (subtaskNode) {
      const subtaskData = subtaskNode.data as SubtaskNodeData;
      return {
        subtaskLabel: subtaskData.label || 'Untitled Subtask',
        fields: subtaskData.fields || [],
      };
    }
  }

  const incomingEdge = edges.find(e => e.target === nodeId);
  if (!incomingEdge) return null;

  const sourceNode = nodes.find(n => n.id === incomingEdge.source && n.type === 'subtask');
  if (!sourceNode) return null;

  const subtaskData = sourceNode.data as SubtaskNodeData;
  return {
    subtaskLabel: subtaskData.label || 'Untitled Subtask',
    fields: subtaskData.fields || [],
  };
}

type TabType = 'edit' | 'preview';

export function ReviewNodeConfig({ nodeId, data, allNodes, allEdges, onUpdate, onClose }: ReviewNodeConfigProps) {
  const [label, setLabel] = useState(data.label || '');
  const [description, setDescription] = useState(data.description || '');
  const [activeTab, setActiveTab] = useState<TabType>('edit');

  const sourceSubtask = useMemo(() => {
    return getSourceSubtaskFields(nodeId, allNodes, allEdges, data.sourceSubtaskNodeId);
  }, [nodeId, allNodes, allEdges, data.sourceSubtaskNodeId]);

  // Get reviewable fields (non-instruction fields)
  const reviewableFields = useMemo(() => {
    if (!sourceSubtask) return [];
    return sourceSubtask.fields.filter(f => f.type !== 'instructions');
  }, [sourceSubtask]);

  const [selectedFieldIds, setSelectedFieldIds] = useState<Set<string>>(() => {
    if (data.reviewableFieldIds && data.reviewableFieldIds.length > 0) {
      return new Set(data.reviewableFieldIds);
    }
    return new Set(reviewableFields.map(f => f.id));
  });

  useEffect(() => {
    if (!data.reviewableFieldIds || data.reviewableFieldIds.length === 0) {
      setSelectedFieldIds(new Set(reviewableFields.map(f => f.id)));
    }
  }, [reviewableFields, data.reviewableFieldIds]);

  const toggleField = (fieldId: string) => {
    setSelectedFieldIds(prev => {
      const next = new Set(prev);
      if (next.has(fieldId)) {
        if (next.size > 1) {
          next.delete(fieldId);
        }
      } else {
        next.add(fieldId);
      }
      return next;
    });
  };

  const handleSave = () => {
    onUpdate(nodeId, {
      ...data,
      label,
      description,
      reviewableFieldIds: Array.from(selectedFieldIds),
    });
    onClose();
  };

  return (
    <div className="bg-gray-50 h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Configure Review</h3>
                <p className="text-xs text-gray-500">Select which fields reviewers will evaluate</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full text-xl font-bold bg-transparent border-b-2 border-transparent focus:border-purple-500 focus:outline-none pb-1 placeholder:text-gray-400"
              placeholder="Untitled review"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm text-gray-600 bg-transparent border-b border-transparent focus:border-gray-300 focus:outline-none pb-1 placeholder:text-gray-400"
              placeholder="Add description (optional)"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-6">
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'edit'
              ? 'text-purple-600 border-purple-600'
              : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'preview'
              ? 'text-purple-600 border-purple-600'
              : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'edit' ? (
        <div className="flex-1 overflow-y-auto p-6">
          {sourceSubtask ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">
                  Fields from &quot;{sourceSubtask.subtaskLabel}&quot;
                </p>
                <span className="text-xs text-gray-500">
                  {selectedFieldIds.size} of {reviewableFields.length} selected
                </span>
              </div>

              {/* All fields inline */}
              {sourceSubtask.fields.length > 0 ? (
                <div className="space-y-2">
                  {sourceSubtask.fields.map((field) => {
                    const isInstruction = field.type === 'instructions';
                    const isSelected = selectedFieldIds.has(field.id);

                    if (isInstruction) {
                      // Instructions shown inline, not selectable
                      return (
                        <div
                          key={field.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200"
                        >
                          <div className="w-5 h-5 flex items-center justify-center text-gray-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-500 flex-1">{field.label || 'Instructions'}</span>
                          <span className="text-xs text-gray-400">Not reviewed</span>
                        </div>
                      );
                    }

                    // Reviewable field
                    return (
                      <div
                        key={field.id}
                        onClick={() => toggleField(field.id)}
                        className={`
                          group flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                          ${isSelected
                            ? 'bg-purple-50 border-purple-300'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <div className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                          ${isSelected
                            ? 'bg-purple-500 border-purple-500'
                            : 'border-gray-300 group-hover:border-gray-400'
                          }
                        `}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-sm flex-1 font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                          {field.label || 'Untitled field'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${field.type === 'text' ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-600'
                          }`}>
                          {field.type === 'text' ? 'Short' : 'Long'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>No fields in this subtask</p>
                </div>
              )}

              {reviewableFields.length === 0 && sourceSubtask.fields.length > 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  This subtask only has instructions. Add text fields to make them reviewable.
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-yellow-100 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-medium text-gray-700">No source subtask connected</p>
              <p className="text-sm text-gray-500 mt-1">
                Connect a subtask node to this review node first
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Preview Tab */
        <div className="flex-1 overflow-y-auto">
          <ReviewPreviewPane
            label={label}
            description={description}
            sourceSubtask={sourceSubtask}
            selectedFieldIds={selectedFieldIds}
          />
        </div>
      )}

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {selectedFieldIds.size} field{selectedFieldIds.size !== 1 ? 's' : ''} to review
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-white bg-purple-500 rounded-lg hover:bg-purple-600 font-medium transition-colors shadow-sm"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// Preview component
interface ReviewPreviewPaneProps {
  label: string;
  description: string;
  sourceSubtask: { subtaskLabel: string; fields: TaskField[] } | null;
  selectedFieldIds: Set<string>;
}

function ReviewPreviewPane({ label, description, sourceSubtask, selectedFieldIds }: ReviewPreviewPaneProps) {
  return (
    <div className="bg-gradient-to-b from-purple-50 to-gray-50 min-h-full">
      {/* Preview Banner */}
      <div className="bg-purple-600 text-white px-6 py-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span className="text-sm font-medium">Preview Mode</span>
        <span className="text-xs text-purple-200 ml-2">— This is how reviewers will see this task</span>
      </div>

      <div className="p-6 max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="border-t-4 border-purple-500 px-6 py-5">
            <h2 className="text-2xl font-bold text-gray-900">
              {label || 'Untitled review'}
            </h2>
            {description && (
              <p className="text-gray-600 mt-2">{description}</p>
            )}
            {sourceSubtask && (
              <p className="text-sm text-gray-500 mt-2">
                Reviewing: {sourceSubtask.subtaskLabel}
              </p>
            )}
          </div>

          {/* Fields */}
          <div className="px-6 pb-6 space-y-4">
            {!sourceSubtask ? (
              <div className="text-center py-8 text-gray-400">
                <p>Connect a subtask to see preview</p>
              </div>
            ) : sourceSubtask.fields.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No fields to review</p>
              </div>
            ) : (
              sourceSubtask.fields.map((field) => {
                const isInstruction = field.type === 'instructions';
                const isSelected = selectedFieldIds.has(field.id);

                if (isInstruction) {
                  // Instructions shown inline as context
                  return (
                    <div key={field.id} className="text-sm text-gray-600 italic py-2">
                      {field.label}
                    </div>
                  );
                }

                if (!isSelected) return null;

                // Reviewable field preview
                return (
                  <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">
                        {field.label || 'Untitled field'}
                      </label>
                    </div>

                    {/* Simulated response */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm text-gray-600 italic">
                      [Editor&apos;s response would appear here]
                    </div>

                    {/* Review actions */}
                    <div className="flex items-center gap-3">
                      <button
                        disabled
                        className="flex-1 py-2 px-3 rounded-lg border-2 border-green-300 bg-green-50 text-green-700 text-sm font-medium flex items-center justify-center gap-2 opacity-75"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Accept
                      </button>
                      <button
                        disabled
                        className="flex-1 py-2 px-3 rounded-lg border-2 border-red-300 bg-red-50 text-red-700 text-sm font-medium flex items-center justify-center gap-2 opacity-75"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject
                      </button>
                    </div>

                    {/* Comment field */}
                    <div className="mt-3">
                      <textarea
                        disabled
                        placeholder="Add a comment..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-400 resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Submit */}
          {sourceSubtask && selectedFieldIds.size > 0 && (
            <div className="px-6 pb-6">
              <button
                disabled
                className="w-full py-3 bg-purple-500 text-white rounded-lg font-medium opacity-75 cursor-not-allowed"
              >
                Submit Review
              </button>
              <p className="text-xs text-center text-gray-400 mt-2">
                Disabled in preview
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
