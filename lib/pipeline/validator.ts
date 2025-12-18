import { Pipeline, PipelineNode, PipelineEdge, isSubtaskNode } from '@/types';

export interface ValidationError {
  type: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate a pipeline definition
 */
export function validatePipeline(pipeline: Pipeline): ValidationResult {
  const errors: ValidationError[] = [];

  // Check if pipeline has at least one node
  if (pipeline.nodes.length === 0) {
    errors.push({
      type: 'NO_NODES',
      message: 'Pipeline must have at least one node'
    });
    return { valid: false, errors };
  }

  // Find start node (explicit start type node)
  const startNodes = pipeline.nodes.filter(node => node.type === 'start');
  if (startNodes.length === 0) {
    errors.push({
      type: 'NO_START_NODE',
      message: 'Pipeline must have a start node'
    });
  } else if (startNodes.length > 1) {
    errors.push({
      type: 'MULTIPLE_START_NODES',
      message: `Pipeline must have exactly one start node, found ${startNodes.length}`,
    });
  } else {
    // Verify start node has no incoming edges
    const startNode = startNodes[0];
    const hasIncoming = pipeline.edges.some(e => e.target === startNode.id);
    if (hasIncoming) {
      errors.push({
        type: 'START_NODE_HAS_INCOMING',
        message: 'Start node cannot have incoming edges',
        nodeId: startNode.id
      });
    }
  }

  // Check for at least one end node
  const endNodes = pipeline.nodes.filter(node => node.type === 'end');
  if (endNodes.length === 0) {
    errors.push({
      type: 'NO_END_NODE',
      message: 'Pipeline must have at least one end node'
    });
  }

  // Validate each node
  pipeline.nodes.forEach(node => {
    const nodeErrors = validateNode(node, pipeline.nodes, pipeline.edges);
    errors.push(...nodeErrors);
  });

  // Note: Cycles ARE allowed in pipelines (e.g., review reject → back to subtask for revision)

  // Validate edges
  pipeline.edges.forEach(edge => {
    const edgeErrors = validateEdge(edge, pipeline.nodes);
    errors.push(...edgeErrors);
  });

  return {
    valid: errors.length === 0,
    errors
  };
}


/**
 * Validate a single node
 */
function validateNode(
  node: PipelineNode,
  allNodes: PipelineNode[],
  allEdges: PipelineEdge[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Get outgoing edges for this node
  const outgoingEdges = allEdges.filter(edge => edge.source === node.id);

  switch (node.type) {
    case 'start':
      // Start node must have exactly 1 outgoing edge
      if (outgoingEdges.length === 0) {
        errors.push({
          type: 'NO_OUTGOING_EDGE',
          message: `Start node "${node.label}" must have exactly 1 outgoing edge`,
          nodeId: node.id
        });
      } else if (outgoingEdges.length > 1) {
        errors.push({
          type: 'MULTIPLE_OUTGOING_EDGES',
          message: `Start node "${node.label}" must have exactly 1 outgoing edge, found ${outgoingEdges.length}`,
          nodeId: node.id
        });
      }
      break;

    case 'subtask':
      // Subtask must have exactly 1 outgoing edge
      if (outgoingEdges.length === 0) {
        errors.push({
          type: 'NO_OUTGOING_EDGE',
          message: `Subtask node "${node.label}" must have exactly 1 outgoing edge`,
          nodeId: node.id
        });
      } else if (outgoingEdges.length > 1) {
        errors.push({
          type: 'MULTIPLE_OUTGOING_EDGES',
          message: `Subtask node "${node.label}" must have exactly 1 outgoing edge, found ${outgoingEdges.length}`,
          nodeId: node.id
        });
      }

      // Subtask must have fields
      if (isSubtaskNode(node) && node.data.fields.length === 0) {
        errors.push({
          type: 'NO_FIELDS',
          message: `Subtask node "${node.label}" must have at least one field`,
          nodeId: node.id
        });
      }
      break;

    case 'review':
      // Review must have exactly 2 outgoing edges (accept and reject)
      if (outgoingEdges.length !== 2) {
        errors.push({
          type: 'INVALID_REVIEW_EDGES',
          message: `Review node "${node.data?.label || node.label}" must have exactly 2 outgoing edges (accept and reject), found ${outgoingEdges.length}`,
          nodeId: node.id
        });
      } else {
        // Check that one is 'accept' and one is 'reject'
        // Edge type can be in edge.type (if it's accept/reject) or edge.data.type (React Flow stores it in data)
        const getEdgeType = (e: PipelineEdge) => {
          // First check if type is specifically 'accept' or 'reject' (not 'default' which React Flow uses)
          if (e.type === 'accept' || e.type === 'reject') return e.type;
          // Otherwise check data.type (where React Flow edges store custom data)
          const dataType = (e as unknown as { data?: { type?: string } }).data?.type;
          return dataType;
        };
        const acceptEdge = outgoingEdges.find(e => getEdgeType(e) === 'accept');
        const rejectEdge = outgoingEdges.find(e => getEdgeType(e) === 'reject');

        if (!acceptEdge) {
          errors.push({
            type: 'NO_ACCEPT_EDGE',
            message: `Review node "${node.data?.label || node.label}" must have an 'accept' edge`,
            nodeId: node.id
          });
        }

        if (!rejectEdge) {
          errors.push({
            type: 'NO_REJECT_EDGE',
            message: `Review node "${node.data?.label || node.label}" must have a 'reject' edge`,
            nodeId: node.id
          });
        }
      }

      // Review must have sourceSubtaskNodeId
      if ('sourceSubtaskNodeId' in node.data) {
        const sourceNode = allNodes.find(n => n.id === node.data.sourceSubtaskNodeId);
        if (!sourceNode) {
          errors.push({
            type: 'INVALID_SOURCE_SUBTASK',
            message: `Review node "${node.label}" references non-existent subtask`,
            nodeId: node.id
          });
        } else if (sourceNode.type !== 'subtask') {
          errors.push({
            type: 'INVALID_SOURCE_TYPE',
            message: `Review node "${node.label}" must reference a subtask node`,
            nodeId: node.id
          });
        }
      }
      break;

    case 'end':
      // End node should have no outgoing edges
      if (outgoingEdges.length > 0) {
        errors.push({
          type: 'END_HAS_OUTGOING_EDGE',
          message: `End node "${node.label}" should not have outgoing edges`,
          nodeId: node.id
        });
      }
      break;
  }

  return errors;
}

/**
 * Validate a single edge
 */
function validateEdge(edge: PipelineEdge, nodes: PipelineNode[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check source node exists
  const sourceNode = nodes.find(n => n.id === edge.source);
  if (!sourceNode) {
    errors.push({
      type: 'INVALID_EDGE_SOURCE',
      message: `Edge references non-existent source node`,
      edgeId: edge.id
    });
  }

  // Check target node exists
  const targetNode = nodes.find(n => n.id === edge.target);
  if (!targetNode) {
    errors.push({
      type: 'INVALID_EDGE_TARGET',
      message: `Edge references non-existent target node`,
      edgeId: edge.id
    });
  }

  return errors;
}

// Note: Cycle detection removed - pipelines can have cycles (e.g., review reject → subtask)
