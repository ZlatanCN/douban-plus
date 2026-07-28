type VisibilityAndPublishingProps = {
  disabled: boolean;
  isPrivate: boolean;
  onChange: (value: { isPrivate: boolean; shareToBroadcast: boolean }) => void;
  shareToBroadcast: boolean;
};

const VisibilityAndPublishing = ({
  disabled,
  isPrivate,
  onChange,
  shareToBroadcast,
}: VisibilityAndPublishingProps) => (
  <fieldset class="atv-interest-modal-visibility">
    <legend>可见范围</legend>
    <label class="atv-interest-modal-visibility-option">
      <input
        checked={!isPrivate}
        disabled={disabled}
        name="interest-visibility"
        onChange={() => onChange({ isPrivate: false, shareToBroadcast })}
        type="radio"
        value="public"
      />
      <span>公开标记</span>
    </label>
    {isPrivate ? (
      <p class="atv-interest-modal-visibility-note">私密标记不会发布动态</p>
    ) : (
      <label class="atv-interest-modal-broadcast-option">
        <input
          checked={shareToBroadcast}
          class="atv-interest-modal-share-broadcast"
          disabled={disabled}
          id="atv-interest-modal-share-broadcast"
          onChange={(event) =>
            onChange({
              isPrivate: false,
              shareToBroadcast: event.currentTarget.checked,
            })
          }
          type="checkbox"
        />
        <span>发布到豆瓣动态</span>
      </label>
    )}
    <label class="atv-interest-modal-visibility-option">
      <input
        checked={isPrivate}
        disabled={disabled}
        name="interest-visibility"
        onChange={() => onChange({ isPrivate: true, shareToBroadcast: false })}
        type="radio"
        value="private"
      />
      <span>仅自己可见</span>
    </label>
  </fieldset>
);

export { VisibilityAndPublishing };
export type { VisibilityAndPublishingProps };
