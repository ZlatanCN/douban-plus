import type { JSX } from "preact";
import { useRef } from "preact/hooks";

import { normalizeInterestTags } from "@/utils/interest-tags";

type InterestTagEditorProps = {
  disabled: boolean;
  draft: string;
  myTags: string[];
  onChange: (update: (tags: string[]) => string[]) => void;
  onDraftChange: (value: string) => void;
  popularTags: string[];
  tags: string[];
};

const TagSuggestionGroup = ({
  disabled,
  label,
  onToggle,
  tags,
  value,
}: {
  disabled: boolean;
  label: string;
  onToggle: (tag: string) => void;
  tags: string[];
  value: string[];
}) => (
  <div class="atv-interest-modal-tag-suggestions">
    <span>{label}</span>
    <div>
      {tags.map((tag) => (
        <button
          aria-pressed={value.includes(tag)}
          class={`atv-interest-modal-tag${value.includes(tag) ? " is-selected" : ""}`}
          data-tag={tag}
          disabled={disabled}
          key={tag}
          onClick={() => onToggle(tag)}
          type="button"
        >
          {tag}
        </button>
      ))}
    </div>
  </div>
);

const InterestTagEditor = ({
  disabled,
  draft,
  myTags,
  onChange,
  onDraftChange,
  popularTags,
  tags,
}: InterestTagEditorProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const currentDraft = (): string => inputRef.current?.value ?? draft;
  const commitDraft = (): void => {
    const pendingDraft = currentDraft();
    onChange((currentTags) =>
      normalizeInterestTags([...currentTags, pendingDraft])
    );
    onDraftChange("");
  };
  const toggleTag = (tag: string): void => {
    const pendingDraft = currentDraft();
    onChange((currentTags) => {
      const committedTags = normalizeInterestTags([
        ...currentTags,
        pendingDraft,
      ]);
      return committedTags.includes(tag)
        ? committedTags.filter((current) => current !== tag)
        : [...committedTags, tag];
    });
    onDraftChange("");
  };
  const onKeyDown = (event: JSX.TargetedKeyboardEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    if (
      event.key === "Backspace" &&
      !event.isComposing &&
      input.value === "" &&
      input.selectionStart === 0 &&
      input.selectionEnd === 0 &&
      tags.length
    ) {
      event.preventDefault();
      onChange((currentTags) => currentTags.slice(0, -1));
      return;
    }
    if (event.key !== " " && event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    commitDraft();
  };

  return (
    <section
      aria-labelledby="atv-interest-modal-tags-label"
      class="atv-interest-modal-tags"
    >
      <div class="atv-interest-modal-field-header">
        <span id="atv-interest-modal-tags-label">标签</span>
        <span>用空格分隔</span>
      </div>
      <div class="atv-interest-modal-tag-input-wrap">
        {tags.map((tag) => (
          <button
            aria-label={`移除标签：${tag}`}
            class="atv-interest-modal-tag is-current"
            data-current-tag={tag}
            disabled={disabled}
            key={tag}
            onClick={() => toggleTag(tag)}
            type="button"
          >
            {tag}
          </button>
        ))}
        <input
          aria-label="输入标签"
          class="atv-interest-modal-tag-input"
          disabled={disabled}
          onBlur={commitDraft}
          onInput={(event) => onDraftChange(event.currentTarget.value)}
          onKeyDown={onKeyDown}
          placeholder={tags.length ? "添加标签" : "输入标签"}
          ref={inputRef}
          value={draft}
        />
      </div>
      {myTags.length ? (
        <TagSuggestionGroup
          disabled={disabled}
          label="我的标签"
          onToggle={toggleTag}
          tags={myTags}
          value={tags}
        />
      ) : null}
      {popularTags.length ? (
        <TagSuggestionGroup
          disabled={disabled}
          label="热门标签"
          onToggle={toggleTag}
          tags={popularTags}
          value={tags}
        />
      ) : null}
    </section>
  );
};

export { InterestTagEditor };
export type { InterestTagEditorProps };
