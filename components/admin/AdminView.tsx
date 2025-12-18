'use client';

import { useState, useEffect, useMemo } from 'react';
import { Pipeline, PipelineNode, PipelineEdge, PipelineExecution } from '@/types';
import Button from '@/components/ui/Button';
import { PipelineBuilder } from './PipelineBuilder';

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
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null);

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
    edges: PipelineEdge[]
  ) => {
    try {
      const url = editingPipeline ? `/api/pipelines/${editingPipeline.id}` : '/api/pipelines';
      const method = editingPipeline ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, nodes, edges }),
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

  // Create skeleton template for new pipelines
  const skeletonTemplate = useMemo(() => createSkeletonTemplate(), []);

  if (showBuilder) {
    const isNewPipeline = !editingPipeline;
    return (
      <PipelineBuilder
        pipelineName={editingPipeline?.name || ''}
        pipelineDescription={editingPipeline?.description}
        initialNodes={isNewPipeline ? skeletonTemplate.nodes : editingPipeline?.nodes || []}
        initialEdges={isNewPipeline ? skeletonTemplate.edges : editingPipeline?.edges || []}
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
        <Button onClick={() => setShowBuilder(true)}>
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
          <Button onClick={() => setShowBuilder(true)}>
            Create Your First Pipeline
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pipelines.map((pipeline) => (
            <div
              key={pipeline.id}
              className="bg-white border border-gray-300 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{pipeline.name}</h3>
                  {pipeline.description && (
                    <p className="text-sm text-gray-600 mt-1">{pipeline.description}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 text-xs text-gray-600 mb-4">
                <div>
                  <span className="font-medium">{pipeline.nodes.length}</span> nodes
                </div>
                <div>
                  <span className="font-medium">{pipeline.edges.length}</span> connections
                </div>
              </div>

              <div className="flex gap-2 text-xs mb-4">
                <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {pipeline.nodes.filter((n) => n.type === 'subtask').length} subtasks
                </div>
                <div className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                  {pipeline.nodes.filter((n) => n.type === 'review').length} reviews
                </div>
              </div>

              <div className="text-xs text-gray-600 mb-4">
                <div>Total executions: {getExecutionCount(pipeline.id)}</div>
                <div>Active: {getActiveExecutionCount(pipeline.id)}</div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleStartExecution(pipeline.id)}
                  className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium"
                >
                  Start
                </button>
                <button
                  onClick={() => {
                    setEditingPipeline(pipeline);
                    setShowBuilder(true);
                  }}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeletePipeline(pipeline.id)}
                  className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
