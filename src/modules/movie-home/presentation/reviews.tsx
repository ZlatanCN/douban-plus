import type { MovieHomeData } from "@/modules/movie-home/domain";
import { Section } from "@/shared/components/layout/section";

type ReviewsProps = {
  reviews: NonNullable<MovieHomeData["reviews"]>;
};

const Reviews = ({ reviews }: ReviewsProps) => {
  if (reviews.items.length === 0) {
    return null;
  }

  return (
    <Section id="atv-movie-home-reviews" title="最受欢迎的影评">
      <div class="atv-movie-home-review-links">
        <a href={reviews.more.href}>{reviews.more.label}</a>
        <a href={reviews.latest.href}>{reviews.latest.label}</a>
      </div>
      <div class="atv-movie-home-reviews">
        {reviews.items.map((review) => (
          <article class="atv-movie-home-review" key={review.href}>
            {review.poster ? (
              <img alt="" loading="lazy" src={review.poster} />
            ) : null}
            <div>
              <h3>
                <a href={review.href}>{review.title}</a>
              </h3>
              <p class="atv-movie-home-review-meta">
                <a href={review.author.href}>{review.author.label}</a>
                <span>评论</span>
                <a href={review.subject.href}>{review.subject.label}</a>
              </p>
              <p>
                {review.summary} <a href={review.fullTextHref}>全文</a>
              </p>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
};

export { Reviews };
