import { getEditorQueue } from '@/lib/data/queue';
import { ApiResponse, EditorQueueItem } from '@/types';

/**
 * GET /api/queue/editor
 * Fetch editor queue (FIFO across all pipeline executions)
 */
export async function GET() {
  try {
    const queue = await getEditorQueue();
    return Response.json({ success: true, data: queue } as ApiResponse<EditorQueueItem[]>);
  } catch (error) {
    console.error('Error fetching editor queue:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch editor queue' } as ApiResponse,
      { status: 500 }
    );
  }
}
