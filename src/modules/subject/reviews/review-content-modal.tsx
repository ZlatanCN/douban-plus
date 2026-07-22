import { useReviewContent } from "@/modules/subject/runtime/use-review-content";

import { ReviewModal } from "./review-modal";
import type { ReviewModalProps } from "./review-modal";

type ReviewContentModalProps = Omit<ReviewModalProps, "content">;

const ReviewContentModal = ({ review, ...props }: ReviewContentModalProps) => {
  const content = useReviewContent(review.id);

  return <ReviewModal {...props} content={content} review={review} />;
};

export { ReviewContentModal };
export type { ReviewContentModalProps };
