import { Pipeline, PipelineNode, PipelineEdge } from '@/types';
import { getPipelineById } from '@/lib/data/pipelines';

/**
 * Get the next node based on current node and routing type
 */
export async function getNextNode(
  pipelineId: string,
  currentNodeId: string,
  edgeType?: 'accept' | 'reject'
): Promise<PipelineNode> {
  const pipeline = await getPipelineById(pipelineId);

  if (!pipeline) {
    throw new Error(`Pipeline ${pipelineId} not found`);
  }

  const outgoingEdges = pipeline.edges.filter(edge => edge.source === currentNodeId);

  if (edgeType) {
    // For review nodes with accept/reject routing
    // Edge type can be in edge.type (if it's accept/reject) or edge.data.type (React Flow stores it in data)
    const getEdgeType = (e: PipelineEdge) => {
      if (e.type === 'accept' || e.type === 'reject') return e.type;
      return (e as unknown as { data?: { type?: string } }).data?.type;
    };
    const edge = outgoingEdges.find(e => getEdgeType(e) === edgeType);
    if (!edge) {
      throw new Error(`No ${edgeType} edge found for node ${currentNodeId}`);
    }
    const targetNode = pipeline.nodes.find(n => n.id === edge.target);
    if (!targetNode) {
      throw new Error(`Target node ${edge.target} not found`);
    }
    return targetNode;
  } else {
    // For subtask nodes (single outgoing edge)
    if (outgoingEdges.length !== 1) {
      throw new Error(`Subtask node must have exactly 1 outgoing edge, found ${outgoingEdges.length}`);
    }
    const targetNode = pipeline.nodes.find(n => n.id === outgoingEdges[0].target);
    if (!targetNode) {
      throw new Error(`Target node ${outgoingEdges[0].target} not found`);
    }
    return targetNode;
  }
}

/**
 * Find start node (explicit start type node)
 */
export function findStartNode(pipeline: Pipeline): PipelineNode {
  const startNode = pipeline.nodes.find(n => n.type === 'start');

  if (!startNode) {
    throw new Error('Pipeline must have a start node');
  }
  return startNode;
}

/**
 * Get the first actionable node after start (the node connected to the start node)
 */
export function getFirstActionableNode(pipeline: Pipeline): PipelineNode {
  const startNode = findStartNode(pipeline);
  const outgoingEdge = pipeline.edges.find(e => e.source === startNode.id);
  
  if (!outgoingEdge) {
    throw new Error('Start node must have an outgoing edge');
  }
  
  const targetNode = pipeline.nodes.find(n => n.id === outgoingEdge.target);
  
  if (!targetNode) {
    throw new Error(`Target node ${outgoingEdge.target} not found`);
  }
  
  return targetNode;
}

/**
 * Get all nodes that can be reached from a given node
 */
export function getReachableNodes(pipeline: Pipeline, startNodeId: string): Set<string> {
  const reachable = new Set<string>();

  function traverse(nodeId: string) {
    if (reachable.has(nodeId)) return;
    reachable.add(nodeId);

    const outgoingEdges = pipeline.edges.filter(e => e.source === nodeId);
    outgoingEdges.forEach(edge => traverse(edge.target));
  }

  traverse(startNodeId);
  return reachable;
}
