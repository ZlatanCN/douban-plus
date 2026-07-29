import { ReviewModal } from "./review-modal";
import type { ReviewModalProps } from "./review-modal";
import { useReviewContent } from "./use-review-content";

type ReviewContentModalProps = Omit<ReviewModalProps, "content">;
const ReviewContentModal = ({ review, ...props }: ReviewContentModalProps) => (
  <ReviewModal
    {...props}
    content={useReviewContent(review.id)}
    review={review}
  />
);
export { ReviewContentModal };
export type { ReviewContentModalProps };
