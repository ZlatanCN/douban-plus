import { fetchAvatarUrls } from "@/api/avatar";
import { applyCommentAvatars } from "@/components/avatar-dom";
import type { Comment } from "@/types";

const startAvatarEffect = (comments: Comment[]): void => {
  if (comments.length === 0) {
    return;
  }

  const links = comments.map((comment) => comment.link);
  void (async () => {
    const urls = await fetchAvatarUrls(links);
    applyCommentAvatars(urls, comments);
  })();
};

export { startAvatarEffect };
