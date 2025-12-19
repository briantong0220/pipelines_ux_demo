'use client';

import { useState, useEffect } from 'react';
import { Pipeline, PipelineNode, PipelineEdge, PipelineExecution, EdgePathType } from '@/types';
import Button from '@/components/ui/Button';
import { PipelineBuilder } from './PipelineBuilder';
import ExecutionDetailView from './ExecutionDetailView';
import { TemplateSelector } from './TemplateSelector';
import { generateTaskReviewPipeline } from '@/lib/pipeline/templates';

// Default skeleton template for new pipelines
function createSkeletonTemplate(): { nodes: PipelineNode[]; edges: PipelineEdge[] } {
  const startNodeId = `start-${Date.now()}`;
  const endNodeId = `end-${Date.now() + 1}`;

  const nodes: PipelineNode[] = [
    {
      id: startNodeId,
      type: 'start',
      label: 'Pipeline Start',
      position: { x: 250, y: 50 },
      data: { label: 'Pipeline Start' },
    },
    {
      id: endNodeId,
      type: 'end',
      label: 'Pipeline Complete',
      position: { x: 250, y: 300 },
      data: { label: 'Pipeline Complete' },
    },
  ];

  const edges: PipelineEdge[] = [
    {
      id: `edge-${startNodeId}-${endNodeId}`,
      source: startNodeId,
      target: endNodeId,
      type: 'deletable',
    },
  ];

  return { nodes, edges };
}

export default function AdminView() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [executions, setExecutions] = useState<PipelineExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null);
  const [viewingExecutionId, setViewingExecutionId] = useState<string | null>(null);
  const [builderInitialNodes, setBuilderInitialNodes] = useState<PipelineNode[]>([]);
  const [builderInitialEdges, setBuilderInitialEdges] = useState<PipelineEdge[]>([]);

  const fetchPipelines = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/pipelines');
      const result = await response.json();
      if (result.success) {
        setPipelines(result.data);
      }
    } catch (error) {
      console.error('Error fetching pipelines:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExecutions = async () => {
    try {
      const response = await fetch('/api/executions');
      const result = await response.json();
      if (result.success) {
        setExecutions(result.data);
      }
    } catch (error) {
      console.error('Error fetching executions:', error);
    }
  };

  useEffect(() => {
    fetchPipelines();
    fetchExecutions();
  }, []);

  const handleSavePipeline = async (
    name: string,
    description: string,
    nodes: PipelineNode[],
    edges: PipelineEdge[],
    edgePathType: EdgePathType
  ) => {
    try {
      const url = editingPipeline ? `/api/pipelines/${editingPipeline.id}` : '/api/pipelines';
      const method = editingPipeline ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, nodes, edges, edgePathType }),
      });

      const result = await response.json();
      if (result.success) {
        setShowBuilder(false);
        setEditingPipeline(null);
        fetchPipelines();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving pipeline:', error);
      alert('Failed to save pipeline');
    }
  };

  const handleStartExecution = async (pipelineId: string) => {
    try {
      const response = await fetch('/api/executions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipelineId }),
      });

      const result = await response.json();
      if (result.success) {
        alert('Pipeline execution started!');
        fetchExecutions();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error starting execution:', error);
      alert('Failed to start execution');
    }
  };

  const handleDeletePipeline = async (pipelineId: string) => {
    if (!confirm('Are you sure you want to delete this pipeline?')) return;

    try {
      const response = await fetch(`/api/pipelines/${pipelineId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        fetchPipelines();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting pipeline:', error);
      alert('Failed to delete pipeline');
    }
  };

  const getExecutionCount = (pipelineId: string) => {
    return executions.filter((e) => e.pipelineId === pipelineId).length;
  };

  const getActiveExecutionCount = (pipelineId: string) => {
    return executions.filter((e) => e.pipelineId === pipelineId && e.status === 'active').length;
  };

  const handleSelectBlank = () => {
    setShowTemplateSelector(false);
    const { nodes, edges } = createSkeletonTemplate();
    setBuilderInitialNodes(nodes);
    setBuilderInitialEdges(edges);
    setShowBuilder(true);
  };

  const handleSelectTaskReview = (taskCount: number) => {
    setShowTemplateSelector(false);
    const { nodes, edges } = generateTaskReviewPipeline(taskCount);
    setBuilderInitialNodes(nodes);
    setBuilderInitialEdges(edges);
    setShowBuilder(true);
  };

  const handleCreatePipeline = () => {
    setEditingPipeline(null);
    setShowTemplateSelector(true);
  };

  // View execution details
  if (viewingExecutionId) {
    return (
      <ExecutionDetailView
        executionId={viewingExecutionId}
        onClose={() => setViewingExecutionId(null)}
      />
    );
  }

  if (showTemplateSelector) {
    return (
      <TemplateSelector
        onSelectBlank={handleSelectBlank}
        onSelectTaskReview={handleSelectTaskReview}
        onCancel={() => setShowTemplateSelector(false)}
      />
    );
  }

  if (showBuilder) {
    return (
      <PipelineBuilder
        pipelineName={editingPipeline?.name || ''}
        pipelineDescription={editingPipeline?.description}
        initialNodes={editingPipeline ? editingPipeline.nodes : builderInitialNodes}
        initialEdges={editingPipeline ? editingPipeline.edges : builderInitialEdges}
        initialEdgePathType={editingPipeline?.edgePathType}
        onSave={handleSavePipeline}
        onCancel={() => {
          setShowBuilder(false);
          setEditingPipeline(null);
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-gray-600">Create and manage workflow pipelines</p>
        </div>
        <Button onClick={handleCreatePipeline}>
          Create Pipeline
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading pipelines...</p>
        </div>
      ) : pipelines.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No pipelines created yet</p>
          <Button onClick={handleCreatePipeline}>
            Create Your First Pipeline
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pipelines.map((pipeline) => (
            <div
              key={pipeline.id}
              className="bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{pipeline.name}</h3>
                  {pipeline.description && (
                    <p className="text-sm text-gray-600 mt-1">{pipeline.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleStartExecution(pipeline.id)}
                  className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm ml-3 flex-shrink-0"
                  title="Start new execution"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>

              <div className="flex gap-4 text-xs text-gray-600 mb-3">
                <div>
                  <span className="font-medium">{pipeline.nodes.length}</span> nodes
                </div>
                <div>
                  <span className="font-medium">{pipeline.edges.length}</span> connections
                </div>
              </div>

              <div className="flex gap-2 text-xs mb-3">
                <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {pipeline.nodes.filter((n) => n.type === 'subtask').length} subtasks
                </div>
                <div className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                  {pipeline.nodes.filter((n) => n.type === 'review').length} reviews
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-4">
                <span>{getExecutionCount(pipeline.id)} executions</span>
                {getActiveExecutionCount(pipeline.id) > 0 && (
                  <span className="ml-2 text-green-600">({getActiveExecutionCount(pipeline.id)} active)</span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingPipeline(pipeline);
                    setShowBuilder(true);
                  }}
                  className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium transition-colors"
                >
                  Edit Pipeline
                </button>
                <button
                  onClick={() => handleDeletePipeline(pipeline.id)}
                  className="px-3 py-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete pipeline"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Executions List */}
      {executions.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Pipeline Executions</h3>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Pipeline</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Started</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Completed</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {executions.map((exec) => {
                  const pipeline = pipelines.find(p => p.id === exec.pipelineId);
                  return (
                    <tr key={exec.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {pipeline?.name || 'Unknown Pipeline'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${exec.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                          }`}>
                          {exec.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(exec.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {exec.completedAt ? new Date(exec.completedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setViewingExecutionId(exec.id)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
