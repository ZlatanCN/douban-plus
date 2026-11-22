import type { MovieHomeData } from "@/modules/movie-home/domain";
import { Section } from "@/shared/components/layout/section";

type ListsProps = {
  lists: NonNullable<MovieHomeData["lists"]>;
};

const Lists = ({ lists }: ListsProps) => {
  if (lists.items.length === 0) {
    return null;
  }

  return (
    <Section id="atv-movie-home-lists" title="热门片单">
      <ul class="atv-movie-home-lists">
        {lists.items.map((item) => (
          <li key={item.href}>
            <a href={item.href}>{item.title}</a>
            <span>{item.recommendations}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
};

export { Lists };
