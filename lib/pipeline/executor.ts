import {
  PipelineExecution,
  Pipeline,
  NodeExecution,
  SubtaskExecution,
  ReviewExecution,
  EndExecution,
  FieldExecutionHistory,
  FieldVersion,
  FieldReviewResult,
  SubtaskNodeData,
  isSubtaskExecution,
  isReviewExecution
} from '@/types';
import { getNextNode, getFirstActionableNode } from './router';
import { randomUUID } from 'crypto';

/**
 * Initialize node execution for a specific node
 */
function initializeNodeExecution(
  node: { id: string; type: string; data: unknown },
  isStartNode: boolean
): NodeExecution {
  if (node.type === 'subtask') {
    const subtaskData = node.data as SubtaskNodeData;
    // Only track non-instruction fields (instructions are read-only context)
    const fieldHistories: FieldExecutionHistory[] = subtaskData.fields
      .filter(field => field.type !== 'instructions')
      .map(field => ({
        fieldId: field.id,
        versions: [],
        currentVersion: 0
      }));

    return {
      nodeId: node.id,
      status: isStartNode ? 'pending' : 'pending',
      fieldHistories,
      startedAt: isStartNode ? new Date().toISOString() : undefined
    } as SubtaskExecution;
  } else if (node.type === 'review') {
    return {
      nodeId: node.id,
      status: 'pending',
      sourceSubtaskNodeId: (node.data as { sourceSubtaskNodeId: string }).sourceSubtaskNodeId,
      allFieldsAccepted: false
    } as ReviewExecution;
  } else {
    // end node
    return {
      nodeId: node.id,
      status: 'pending'
    } as EndExecution;
  }
}

/**
 * Start a new pipeline execution
 */
export async function startExecution(pipeline: Pipeline): Promise<PipelineExecution> {
  // Find the first actionable node (the node connected to the start node)
  const firstActionableNode = getFirstActionableNode(pipeline);

  // Initialize all node executions (skip start nodes as they don't need execution tracking)
  const nodeExecutions = pipeline.nodes
    .filter(node => node.type !== 'start')
    .map(node =>
      initializeNodeExecution(node, node.id === firstActionableNode.id)
    );

  const execution: PipelineExecution = {
    id: randomUUID(),
    pipelineId: pipeline.id,
    currentNodeId: firstActionableNode.id,
    status: 'active',
    nodeExecutions,
    createdAt: new Date().toISOString()
  };

  return execution;
}

/**
 * Find node execution by node ID
 */
function findNodeExecution(execution: PipelineExecution, nodeId: string): NodeExecution {
  const nodeExec = execution.nodeExecutions.find(ne => ne.nodeId === nodeId);
  if (!nodeExec) {
    throw new Error(`Node execution not found for node ${nodeId}`);
  }
  return nodeExec;
}

/**
 * Advance execution after subtask submission
 */
export async function advanceAfterSubtask(
  execution: PipelineExecution,
  nodeId: string,
  fieldValues: Record<string, string>
): Promise<PipelineExecution> {
  // Find the subtask execution
  const nodeExec = findNodeExecution(execution, nodeId);

  if (!isSubtaskExecution(nodeExec)) {
    throw new Error(`Node ${nodeId} is not a subtask node`);
  }

  const subtaskExec = nodeExec as SubtaskExecution;

  // Create new versions for each field
  subtaskExec.fieldHistories.forEach(history => {
    const fieldValue = fieldValues[history.fieldId];
    if (fieldValue === undefined) {
      throw new Error(`Missing value for field ${history.fieldId}`);
    }

    // Only create new version if this is a new submission or value changed
    const lastVersion = history.versions[history.versions.length - 1];
    const shouldCreateNewVersion =
      !lastVersion || // First submission
      lastVersion.status === 'rejected' || // Field was rejected, need new version
      lastVersion.value !== fieldValue; // Value changed

    if (shouldCreateNewVersion) {
      const newVersion: FieldVersion = {
        version: history.currentVersion + 1,
        value: fieldValue,
        submittedAt: new Date().toISOString(),
        submittedBy: 'editor', // TODO: Replace with actual user
        status: 'pending' // Awaiting review
      };
      history.versions.push(newVersion);
      history.currentVersion = newVersion.version;
    }
  });

  subtaskExec.status = 'waiting_review';
  subtaskExec.lastUpdatedAt = new Date().toISOString();

  // Move to next node (should be review node)
  const nextNode = await getNextNode(execution.pipelineId, nodeId);
  execution.currentNodeId = nextNode.id;

  // Update next node status
  const nextExec = findNodeExecution(execution, nextNode.id);
  nextExec.status = 'in_progress';

  return execution;
}

/**
 * Advance execution after review
 */
export async function advanceAfterReview(
  execution: PipelineExecution,
  nodeId: string,
  fieldReviews: FieldReviewResult[]
): Promise<PipelineExecution> {
  const nodeExec = findNodeExecution(execution, nodeId);

  if (!isReviewExecution(nodeExec)) {
    throw new Error(`Node ${nodeId} is not a review node`);
  }

  const reviewExec = nodeExec as ReviewExecution;

  // Find the source subtask execution
  const subtaskExec = findNodeExecution(
    execution,
    reviewExec.sourceSubtaskNodeId
  ) as SubtaskExecution;

  if (!isSubtaskExecution(subtaskExec)) {
    throw new Error(`Source node ${reviewExec.sourceSubtaskNodeId} is not a subtask`);
  }

  // Apply review results to field versions
  let allAccepted = true;
  fieldReviews.forEach(review => {
    const history = subtaskExec.fieldHistories.find(h => h.fieldId === review.fieldId);
    if (!history) {
      throw new Error(`Field ${review.fieldId} not found in subtask`);
    }

    const latestVersion = history.versions[history.versions.length - 1];
    if (!latestVersion) {
      throw new Error(`No version found for field ${review.fieldId}`);
    }

    latestVersion.status = review.status;
    latestVersion.reviewComment = review.comment;
    latestVersion.reviewedAt = new Date().toISOString();
    latestVersion.reviewedBy = 'reviewer'; // TODO: Replace with actual user

    if (review.status === 'rejected') {
      allAccepted = false;
    }
  });

  reviewExec.allFieldsAccepted = allAccepted;
  reviewExec.status = 'completed';
  reviewExec.reviewedAt = new Date().toISOString();

  // Route to next node based on review outcome
  const edgeType = allAccepted ? 'accept' : 'reject';
  const nextNode = await getNextNode(execution.pipelineId, nodeId, edgeType);
  execution.currentNodeId = nextNode.id;

  if (nextNode.type === 'subtask') {
    // If routed back to subtask, mark as revision_needed
    subtaskExec.status = 'revision_needed';
    subtaskExec.lastUpdatedAt = new Date().toISOString();
  } else if (nextNode.type === 'end') {
    // Pipeline completed
    execution.status = 'completed';
    execution.completedAt = new Date().toISOString();
    const endExec = findNodeExecution(execution, nextNode.id) as EndExecution;
    endExec.status = 'completed';
    endExec.completedAt = new Date().toISOString();
  } else {
    // Next node is another subtask or review
    const nextExec = findNodeExecution(execution, nextNode.id);
    nextExec.status = 'pending';
  }

  return execution;
}

/**
 * Get fields that need to be re-submitted (rejected fields)
 */
export function getRejectedFieldIds(subtaskExec: SubtaskExecution): string[] {
  return subtaskExec.fieldHistories
    .filter(history => {
      const latestVersion = history.versions[history.versions.length - 1];
      return latestVersion && latestVersion.status === 'rejected';
    })
    .map(history => history.fieldId);
}

/**
 * Get accepted field values (to pre-fill in revision form)
 */
export function getAcceptedFieldValues(subtaskExec: SubtaskExecution): Record<string, string> {
  const acceptedValues: Record<string, string> = {};

  subtaskExec.fieldHistories.forEach(history => {
    const latestVersion = history.versions[history.versions.length - 1];
    if (latestVersion && latestVersion.status === 'accepted') {
      acceptedValues[history.fieldId] = latestVersion.value;
    }
  });

  return acceptedValues;
}
