import { getReviewerQueue } from '@/lib/data/queue';
import { ApiResponse, ReviewerQueueItem } from '@/types';

/**
 * GET /api/queue/reviewer
 * Fetch reviewer queue (FIFO across all pipeline executions)
 */
export async function GET() {
  try {
    const queue = await getReviewerQueue();
    return Response.json({ success: true, data: queue } as ApiResponse<ReviewerQueueItem[]>);
  } catch (error) {
    console.error('Error fetching reviewer queue:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch reviewer queue' } as ApiResponse,
      { status: 500 }
    );
  }
}
