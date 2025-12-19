import { Review, FieldComment } from '@/types';
import prisma from '@/lib/prisma';

/**
 * Get all reviews
 */
export async function getReviews(): Promise<Review[]> {
  const reviews = await prisma.review.findMany({
    orderBy: { reviewedAt: 'desc' },
  });

  return reviews.map((review) => ({
    id: review.id,
    responseId: review.responseId,
    fieldComments: review.fieldComments as unknown as FieldComment[],
    overallRating: review.overallRating,
    overallComment: review.overallComment ?? undefined,
    reviewedAt: review.reviewedAt.toISOString(),
    reviewedBy: review.reviewedBy,
  }));
}

/**
 * Get a review by ID
 */
export async function getReviewById(id: string): Promise<Review | undefined> {
  const review = await prisma.review.findUnique({
    where: { id },
  });

  if (!review) return undefined;

  return {
    id: review.id,
    responseId: review.responseId,
    fieldComments: review.fieldComments as unknown as FieldComment[],
    overallRating: review.overallRating,
    overallComment: review.overallComment ?? undefined,
    reviewedAt: review.reviewedAt.toISOString(),
    reviewedBy: review.reviewedBy,
  };
}

/**
 * Get review for a specific response
 */
export async function getReviewByResponseId(responseId: string): Promise<Review | undefined> {
  const review = await prisma.review.findUnique({
    where: { responseId },
  });

  if (!review) return undefined;

  return {
    id: review.id,
    responseId: review.responseId,
    fieldComments: review.fieldComments as unknown as FieldComment[],
    overallRating: review.overallRating,
    overallComment: review.overallComment ?? undefined,
    reviewedAt: review.reviewedAt.toISOString(),
    reviewedBy: review.reviewedBy,
  };
}

/**
 * Create a new review
 */
export async function createReview(reviewData: {
  responseId: string;
  fieldComments: FieldComment[];
  overallRating: number;
  overallComment?: string;
}): Promise<Review> {
  const review = await prisma.review.create({
    data: {
      responseId: reviewData.responseId,
      fieldComments: reviewData.fieldComments as unknown as object,
      overallRating: reviewData.overallRating,
      overallComment: reviewData.overallComment,
      reviewedBy: 'reviewer',
    },
  });

  return {
    id: review.id,
    responseId: review.responseId,
    fieldComments: review.fieldComments as unknown as FieldComment[],
    overallRating: review.overallRating,
    overallComment: review.overallComment ?? undefined,
    reviewedAt: review.reviewedAt.toISOString(),
    reviewedBy: review.reviewedBy,
  };
}

/**
 * Update an existing review
 */
export async function updateReview(
  id: string,
  updates: {
    fieldComments?: FieldComment[];
    overallRating?: number;
    overallComment?: string;
  }
): Promise<Review | undefined> {
  try {
    const review = await prisma.review.update({
      where: { id },
      data: {
        ...(updates.fieldComments !== undefined && {
          fieldComments: updates.fieldComments as unknown as object,
        }),
        ...(updates.overallRating !== undefined && { overallRating: updates.overallRating }),
        ...(updates.overallComment !== undefined && { overallComment: updates.overallComment }),
        reviewedAt: new Date(),
      },
    });

    return {
      id: review.id,
      responseId: review.responseId,
      fieldComments: review.fieldComments as unknown as FieldComment[],
      overallRating: review.overallRating,
      overallComment: review.overallComment ?? undefined,
      reviewedAt: review.reviewedAt.toISOString(),
      reviewedBy: review.reviewedBy,
    };
  } catch {
    return undefined; // Review not found
  }
}
