import type { Comment } from "@/modules/subject/domain";

type CommentAvatarProps = {
  className: string;
  comment: Pick<Comment, "avatar" | "cid" | "name">;
};

const CommentAvatar = ({ className, comment }: CommentAvatarProps) => (
  <div
    class={className}
    data-cid={comment.cid || undefined}
    style={
      comment.avatar
        ? { backgroundImage: `url("${comment.avatar}")` }
        : undefined
    }
  >
    {comment.avatar ? null : (comment.name || "?").slice(0, 1).toUpperCase()}
  </div>
);

export { CommentAvatar };
export type { CommentAvatarProps };
