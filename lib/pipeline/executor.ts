import {
  PipelineExecution,
  Pipeline,
  PipelineEdge,
  NodeExecution,
  SubtaskExecution,
  ReviewExecution,
  EndExecution,
  FieldExecutionHistory,
  FieldVersion,
  FieldReviewResult,
  SubtaskNodeData,
  ReviewNodeData,
  AssignmentBehavior,
  isSubtaskExecution,
  isReviewExecution
} from '@/types';
import { getNextNode, getFirstActionableNode, getEdge } from './router';
import { getPipelineById } from '@/lib/data/pipelines';
import { randomUUID } from 'crypto';

function getAttemptCount(subtaskExec: SubtaskExecution): number {
  if (subtaskExec.fieldHistories.length === 0) return 0;
  return Math.max(...subtaskExec.fieldHistories.map(h => h.currentVersion));
}

function resolveAssignment(
  behavior: AssignmentBehavior | undefined,
  currentUserId: string,
  previousCompletedBy: string | undefined
): string | undefined {
  if (!behavior || behavior === 'any') {
    return undefined;
  }
  if (behavior === 'same_person') {
    return previousCompletedBy;
  }
  if (behavior === 'different_person') {
    return previousCompletedBy ? `not:${previousCompletedBy}` : undefined;
  }
  return undefined;
}

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

export async function advanceAfterSubtask(
  execution: PipelineExecution,
  nodeId: string,
  fieldValues: Record<string, string>,
  userId: string = 'editor'
): Promise<PipelineExecution> {
  const nodeExec = findNodeExecution(execution, nodeId);

  if (!isSubtaskExecution(nodeExec)) {
    throw new Error(`Node ${nodeId} is not a subtask node`);
  }

  const subtaskExec = nodeExec as SubtaskExecution;

  subtaskExec.fieldHistories.forEach(history => {
    const fieldValue = fieldValues[history.fieldId];
    if (fieldValue === undefined) {
      throw new Error(`Missing value for field ${history.fieldId}`);
    }

    const lastVersion = history.versions[history.versions.length - 1];
    const shouldCreateNewVersion =
      !lastVersion ||
      lastVersion.status === 'rejected' ||
      lastVersion.value !== fieldValue;

    if (shouldCreateNewVersion) {
      const newVersion: FieldVersion = {
        version: history.currentVersion + 1,
        value: fieldValue,
        submittedAt: new Date().toISOString(),
        submittedBy: userId,
        status: 'pending'
      };
      history.versions.push(newVersion);
      history.currentVersion = newVersion.version;
    }
  });

  subtaskExec.status = 'waiting_review';
  subtaskExec.completedBy = userId;
  subtaskExec.lastUpdatedAt = new Date().toISOString();

  const nextNode = await getNextNode(execution.pipelineId, nodeId);
  const edge = await getEdge(execution.pipelineId, nodeId);

  execution.currentNodeId = nextNode.id;

  const nextExec = findNodeExecution(execution, nextNode.id);
  nextExec.status = 'in_progress';

  if (isReviewExecution(nextExec)) {
    const assignmentBehavior = edge?.data?.assignmentBehavior;
    nextExec.assignedTo = resolveAssignment(assignmentBehavior, userId, subtaskExec.completedBy);
  }

  return execution;
}

export async function advanceAfterReview(
  execution: PipelineExecution,
  nodeId: string,
  fieldReviews: FieldReviewResult[],
  userId: string = 'reviewer'
): Promise<PipelineExecution> {
  const nodeExec = findNodeExecution(execution, nodeId);

  if (!isReviewExecution(nodeExec)) {
    throw new Error(`Node ${nodeId} is not a review node`);
  }

  const reviewExec = nodeExec as ReviewExecution;

  const subtaskExec = findNodeExecution(
    execution,
    reviewExec.sourceSubtaskNodeId
  ) as SubtaskExecution;

  if (!isSubtaskExecution(subtaskExec)) {
    throw new Error(`Source node ${reviewExec.sourceSubtaskNodeId} is not a subtask`);
  }

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
    latestVersion.reviewedBy = userId;

    if (review.status === 'rejected') {
      allAccepted = false;
    }
  });

  reviewExec.allFieldsAccepted = allAccepted;
  reviewExec.status = 'completed';
  reviewExec.completedBy = userId;
  reviewExec.reviewedAt = new Date().toISOString();

  let edgeType: 'accept' | 'reject' | 'max_attempts';

  if (allAccepted) {
    edgeType = 'accept';
  } else {
    const pipeline = await getPipelineById(execution.pipelineId);
    const reviewNode = pipeline?.nodes.find(n => n.id === nodeId);
    const maxAttempts = (reviewNode?.data as ReviewNodeData)?.maxAttempts;

    const attemptCount = getAttemptCount(subtaskExec);

    if (maxAttempts && attemptCount >= maxAttempts) {
      edgeType = 'max_attempts';
    } else {
      edgeType = 'reject';
    }
  }

  const nextNode = await getNextNode(execution.pipelineId, nodeId, edgeType);
  const edge = await getEdge(execution.pipelineId, nodeId, edgeType);
  const assignmentBehavior = edge?.data?.assignmentBehavior;

  execution.currentNodeId = nextNode.id;

  if (nextNode.type === 'subtask') {
    subtaskExec.status = 'revision_needed';
    subtaskExec.lastUpdatedAt = new Date().toISOString();
    subtaskExec.assignedTo = resolveAssignment(assignmentBehavior, userId, subtaskExec.completedBy);
  } else if (nextNode.type === 'end') {
    execution.status = 'completed';
    execution.completedAt = new Date().toISOString();
    const endExec = findNodeExecution(execution, nextNode.id) as EndExecution;
    endExec.status = 'completed';
    endExec.completedAt = new Date().toISOString();
  } else {
    const nextExec = findNodeExecution(execution, nextNode.id);
    nextExec.status = 'pending';
    if (isSubtaskExecution(nextExec)) {
      nextExec.assignedTo = resolveAssignment(assignmentBehavior, userId, subtaskExec.completedBy);
    } else if (isReviewExecution(nextExec)) {
      nextExec.assignedTo = resolveAssignment(assignmentBehavior, userId, reviewExec.completedBy);
    }
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
