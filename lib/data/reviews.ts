import { Review, FieldComment } from '@/types';
import { readJSONFile, writeJSONFile } from './storage';
import { randomUUID } from 'crypto';

const REVIEWS_FILE = 'reviews.json';

interface ReviewsData {
  reviews: Review[];
}

const DEFAULT_DATA: ReviewsData = {
  reviews: []
};

/**
 * Get all reviews
 */
export async function getReviews(): Promise<Review[]> {
  const data = await readJSONFile<ReviewsData>(REVIEWS_FILE, DEFAULT_DATA);
  return data.reviews;
}

/**
 * Get a review by ID
 */
export async function getReviewById(id: string): Promise<Review | undefined> {
  const reviews = await getReviews();
  return reviews.find(review => review.id === id);
}

/**
 * Get review for a specific response
 */
export async function getReviewByResponseId(responseId: string): Promise<Review | undefined> {
  const reviews = await getReviews();
  return reviews.find(review => review.responseId === responseId);
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
  const data = await readJSONFile<ReviewsData>(REVIEWS_FILE, DEFAULT_DATA);

  const newReview: Review = {
    id: randomUUID(),
    responseId: reviewData.responseId,
    fieldComments: reviewData.fieldComments,
    overallRating: reviewData.overallRating,
    overallComment: reviewData.overallComment,
    reviewedAt: new Date().toISOString(),
    reviewedBy: 'reviewer'
  };

  data.reviews.push(newReview);
  await writeJSONFile(REVIEWS_FILE, data);

  return newReview;
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
  const data = await readJSONFile<ReviewsData>(REVIEWS_FILE, DEFAULT_DATA);

  const reviewIndex = data.reviews.findIndex(review => review.id === id);
  if (reviewIndex === -1) {
    return undefined;
  }

  data.reviews[reviewIndex] = {
    ...data.reviews[reviewIndex],
    ...updates,
    reviewedAt: new Date().toISOString()
  };

  await writeJSONFile(REVIEWS_FILE, data);
  return data.reviews[reviewIndex];
}
