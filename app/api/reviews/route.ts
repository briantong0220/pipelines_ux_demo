import { NextRequest } from 'next/server';
import { getReviews, createReview, getReviewByResponseId } from '@/lib/data/reviews';
import { ApiResponse, Review } from '@/types';

/**
 * GET /api/reviews
 * Fetch all reviews
 * Optional query param: ?responseId=xxx to get review for a specific response
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const responseId = searchParams.get('responseId');

    if (responseId) {
      const review = await getReviewByResponseId(responseId);
      return Response.json({ success: true, data: review } as ApiResponse<Review | undefined>);
    }

    const reviews = await getReviews();
    return Response.json({ success: true, data: reviews } as ApiResponse<Review[]>);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch reviews' } as ApiResponse,
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews
 * Create a new review
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.responseId || !body.fieldComments || !Array.isArray(body.fieldComments)) {
      return Response.json(
        { success: false, error: 'Invalid review data' } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate rating is between 1-5
    if (typeof body.overallRating !== 'number' || body.overallRating < 1 || body.overallRating > 5) {
      return Response.json(
        { success: false, error: 'Overall rating must be between 1 and 5' } as ApiResponse,
        { status: 400 }
      );
    }

    const review = await createReview(body);
    return Response.json({ success: true, data: review } as ApiResponse<Review>);
  } catch (error) {
    console.error('Error creating review:', error);
    return Response.json(
      { success: false, error: 'Failed to create review' } as ApiResponse,
      { status: 500 }
    );
  }
}
