'use client';

import { useState, useEffect } from 'react';
import {
  PipelineExecution,
  Pipeline,
  PipelineNode,
  isSubtaskExecution,
  isReviewExecution,
  SubtaskExecution,
  ReviewExecution,
  SubtaskNodeData,
  ReviewNodeData,
  TaskField,
} from '@/types';
import Button from '@/components/ui/Button';

// Helper component to render field values, including dynamic fields
function FieldValueDisplay({ value, subfields }: { value: string; subfields?: TaskField[] }) {
  if (!value) {
    return <span className="italic text-gray-400">Empty</span>;
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      const hasSubfields = subfields && subfields.length > 0;

      if (typeof parsed[0] === 'string') {
        return (
          <div className="space-y-1">
            {parsed.map((entry: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-medium">
                  {idx + 1}
                </span>
                <span className="text-gray-700">
                  {entry || <span className="text-gray-400 italic">Empty</span>}
                </span>
              </div>
            ))}
          </div>
        );
      }

      return (
        <div className="space-y-2">
          {parsed.map((entry: Record<string, string>, idx: number) => (
            <div key={idx} className="border-l-2 border-gray-200 pl-3">
              <span className="text-xs text-gray-500 font-medium">Entry {idx + 1}</span>
              <div className="mt-1 space-y-1">
                {hasSubfields ? (
                  subfields.map((subfield) => (
                    <div key={subfield.id} className="text-sm">
                      <span className="text-gray-500">{subfield.label || subfield.id}:</span>{' '}
                      <span className="text-gray-700">
                        {entry[subfield.id] || <span className="text-gray-400 italic">Empty</span>}
                      </span>
                    </div>
                  ))
                ) : (
                  Object.entries(entry).map(([key, val]) => (
                    <div key={key} className="text-sm">
                      <span className="text-gray-500">{key === '_value' ? 'Value' : key}:</span>{' '}
                      <span className="text-gray-700">
                        {val || <span className="text-gray-400 italic">Empty</span>}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }
  } catch {
    // Not JSON, display as plain text
  }

  return <span className="whitespace-pre-wrap">{value}</span>;
}

interface ExecutionDetailViewProps {
  executionId: string;
  onClose: () => void;
}

interface TimelineItem {
  type: 'subtask' | 'review';
  nodeId: string;
  nodeLabel: string;
  status: string;
  data: SubtaskExecution | ReviewExecution;
  node: PipelineNode;
}

export default function ExecutionDetailView({ executionId, onClose }: ExecutionDetailViewProps) {
  const [execution, setExecution] = useState<PipelineExecution | null>(null);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch execution
        const execRes = await fetch(`/api/executions/${executionId}`);
        const execResult = await execRes.json();

        if (execResult.success) {
          setExecution(execResult.data);

          // Fetch pipeline
          const pipeRes = await fetch(`/api/pipelines/${execResult.data.pipelineId}`);
          const pipeResult = await pipeRes.json();
          if (pipeResult.success) {
            setPipeline(pipeResult.data);
          }
        }
      } catch (error) {
        console.error('Error fetching execution details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [executionId]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading execution details...</p>
      </div>
    );
  }

  if (!execution || !pipeline) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load execution details</p>
        <Button onClick={onClose} className="mt-4">Go Back</Button>
      </div>
    );
  }

  // Build timeline of subtask and review nodes in execution order
  const buildTimeline = (): TimelineItem[] => {
    const timeline: TimelineItem[] = [];
    const nodeMap = new Map(pipeline.nodes.map(n => [n.id, n]));

    // Find start node
    const startNode = pipeline.nodes.find(n => n.type === 'start');
    if (!startNode) return timeline;

    // Traverse from start
    let currentNodeId: string | undefined = startNode.id;
    const visited = new Set<string>();

    while (currentNodeId && !visited.has(currentNodeId)) {
      visited.add(currentNodeId);
      const node = nodeMap.get(currentNodeId);

      if (node && (node.type === 'subtask' || node.type === 'review')) {
        const nodeExec = execution.nodeExecutions.find(ne => ne.nodeId === node.id);
        if (nodeExec) {
          timeline.push({
            type: node.type as 'subtask' | 'review',
            nodeId: node.id,
            nodeLabel: node.label,
            status: nodeExec.status,
            data: nodeExec as SubtaskExecution | ReviewExecution,
            node,
          });
        }
      }

      // Find next node - get all outgoing edges from current node
      const outgoingEdges = pipeline.edges.filter(e => e.source === currentNodeId);

      if (outgoingEdges.length === 0) {
        // No more edges, we've reached the end
        currentNodeId = undefined;
      } else if (outgoingEdges.length === 1) {
        // Single edge, just follow it
        currentNodeId = outgoingEdges[0].target;
      } else {
        // Multiple edges (review node) - follow the accept path for forward traversal
        const acceptEdge = outgoingEdges.find(e => e.data?.type === 'accept');
        if (acceptEdge) {
          currentNodeId = acceptEdge.target;
        } else {
          // Fallback: find an edge that goes to an unvisited node
          const forwardEdge = outgoingEdges.find(e => !visited.has(e.target));
          currentNodeId = forwardEdge?.target || outgoingEdges[0].target;
        }
      }
    }

    return timeline;
  };

  const timeline = buildTimeline();

  const getFieldLabel = (nodeId: string, fieldId: string): string => {
    const node = pipeline.nodes.find(n => n.id === nodeId);
    if (node?.type === 'subtask') {
      const data = node.data as SubtaskNodeData;
      const field = data.fields.find(f => f.id === fieldId);
      return field?.label || fieldId;
    }
    return fieldId;
  };

  const getFieldDefinition = (nodeId: string, fieldId: string): TaskField | undefined => {
    const node = pipeline.nodes.find(n => n.id === nodeId);
    if (node?.type === 'subtask') {
      const data = node.data as SubtaskNodeData;
      return data.fields.find(f => f.id === fieldId);
    }
    return undefined;
  };

  // Get display status for a subtask - if pipeline is completed, show "completed" for all done subtasks
  const getSubtaskDisplayStatus = (subtaskData: SubtaskExecution): { label: string; style: string } => {
    // Check if all fields in this subtask are accepted
    const allFieldsAccepted = subtaskData.fieldHistories.every(h => {
      const latest = h.versions[h.versions.length - 1];
      return latest && latest.status === 'accepted';
    });

    // For completed pipelines, show appropriate final status
    if (execution.status === 'completed') {
      if (allFieldsAccepted) {
        return { label: 'Completed', style: 'bg-green-100 text-green-700' };
      }
      // Shouldn't happen in a completed pipeline, but handle edge case
      return { label: 'Completed', style: 'bg-green-100 text-green-700' };
    }

    // For active pipelines, show the actual status
    switch (subtaskData.status) {
      case 'completed':
        return { label: 'Completed', style: 'bg-green-100 text-green-700' };
      case 'waiting_review':
        return { label: 'Awaiting Review', style: 'bg-yellow-100 text-yellow-700' };
      case 'revision_needed':
        return { label: 'Revision Needed', style: 'bg-orange-100 text-orange-700' };
      case 'in_progress':
        return { label: 'In Progress', style: 'bg-blue-100 text-blue-700' };
      case 'pending':
        return { label: 'Pending', style: 'bg-gray-100 text-gray-600' };
      default:
        return { label: subtaskData.status, style: 'bg-gray-100 text-gray-600' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
        <div className={`px-6 py-4 ${execution.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-white">{pipeline.name}</h1>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${execution.status === 'completed'
                  ? 'bg-green-400 text-white'
                  : 'bg-blue-400 text-white'
                  }`}>
                  {execution.status === 'completed' ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <p className="text-green-100 text-sm">Execution ID: {execution.id.slice(0, 8)}...</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-green-100 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex gap-6 text-sm">
          <div>
            <span className="text-gray-500">Started:</span>{' '}
            <span className="font-medium text-gray-700">
              {new Date(execution.createdAt).toLocaleString()}
            </span>
          </div>
          {execution.completedAt && (
            <div>
              <span className="text-gray-500">Completed:</span>{' '}
              <span className="font-medium text-gray-700">
                {new Date(execution.completedAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {timeline.map((item, index) => (
          <div key={item.nodeId}>
            {item.type === 'subtask' && isSubtaskExecution(item.data) && (() => {
              const displayStatus = getSubtaskDisplayStatus(item.data);
              return (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Subtask Header */}
                  <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.nodeLabel}</h3>
                        <p className="text-xs text-gray-500">Subtask</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${displayStatus.style}`}>
                      {displayStatus.label}
                    </span>
                  </div>

                  {/* Fields */}
                  <div className="p-5 space-y-4">
                    {item.data.fieldHistories.map((history) => {
                      const latestVersion = history.versions[history.versions.length - 1];
                      const fieldDef = getFieldDefinition(item.nodeId, history.fieldId);
                      return (
                        <div key={history.fieldId} className="border-l-2 border-blue-200 pl-4">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-700">
                              {getFieldLabel(item.nodeId, history.fieldId)}
                            </p>
                            {latestVersion && (
                              <span className={`text-xs px-2 py-0.5 rounded ${latestVersion.status === 'accepted'
                                ? 'bg-green-100 text-green-700'
                                : latestVersion.status === 'rejected'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                {latestVersion.status}
                              </span>
                            )}
                            {history.versions.length > 1 && (
                              <span className="text-xs text-gray-400">
                                ({history.versions.length} versions)
                              </span>
                            )}
                          </div>
                          {latestVersion ? (
                            <div className="text-sm text-gray-600 bg-gray-50 rounded px-3 py-2">
                              <FieldValueDisplay
                                value={latestVersion.value}
                                subfields={fieldDef?.subfields}
                              />
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 italic">Not submitted yet</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {item.type === 'review' && isReviewExecution(item.data) && (
              <>
                {/* Review Separator */}
                <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 border-t-2 border-dashed border-purple-300" />
                  <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-purple-700">{item.nodeLabel}</span>
                    {(() => {
                      // For completed pipeline, show final outcome
                      if (execution.status === 'completed') {
                        return (
                          <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                            Approved
                          </span>
                        );
                      }
                      // For active pipelines, show the review decision
                      if (item.data.allFieldsAccepted) {
                        return (
                          <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                            All Accepted
                          </span>
                        );
                      }
                      if (item.status === 'completed') {
                        return (
                          <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">
                            Revisions Requested
                          </span>
                        );
                      }
                      return (
                        <span className="text-xs bg-gray-400 text-white px-2 py-0.5 rounded-full">
                          Pending
                        </span>
                      );
                    })()}
                  </div>
                  <div className="flex-1 border-t-2 border-dashed border-purple-300" />
                </div>

                {/* Show review details if completed */}
                {item.status === 'completed' && (
                  <div className="bg-purple-50 rounded-lg border border-purple-200 p-4 mb-4">
                    <p className="text-xs text-purple-600 uppercase tracking-wide font-medium mb-2">
                      Review completed {item.data.reviewedAt ? new Date(item.data.reviewedAt).toLocaleString() : ''}
                    </p>

                    {/* Find the subtask this reviews and show field-level feedback */}
                    {(() => {
                      const reviewData = item.data as ReviewExecution;
                      const subtaskExec = execution.nodeExecutions.find(
                        ne => ne.nodeId === reviewData.sourceSubtaskNodeId
                      );
                      if (!subtaskExec || !isSubtaskExecution(subtaskExec)) return null;

                      const reviewedFields = subtaskExec.fieldHistories.filter(h => {
                        const latest = h.versions[h.versions.length - 1];
                        return latest && latest.reviewComment;
                      });

                      if (reviewedFields.length === 0) {
                        return <p className="text-sm text-purple-700 italic">No feedback comments</p>;
                      }

                      return (
                        <div className="space-y-2">
                          {reviewedFields.map(history => {
                            const latest = history.versions[history.versions.length - 1];
                            return (
                              <div key={history.fieldId} className="flex items-start gap-2 text-sm">
                                <span className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs ${latest.status === 'accepted' ? 'bg-green-500' : 'bg-red-500'
                                  }`}>
                                  {latest.status === 'accepted' ? '✓' : '✗'}
                                </span>
                                <div>
                                  <span className="font-medium text-gray-700">
                                    {getFieldLabel(reviewData.sourceSubtaskNodeId, history.fieldId)}:
                                  </span>
                                  <span className="text-gray-600 ml-1">{latest.reviewComment}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {/* Completion Banner */}
        {execution.status === 'completed' && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-center text-white">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-1">Pipeline Completed</h3>
            <p className="text-green-100 text-sm">
              All tasks have been completed and approved
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 flex justify-center">
        <Button onClick={onClose} variant="secondary">
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}


