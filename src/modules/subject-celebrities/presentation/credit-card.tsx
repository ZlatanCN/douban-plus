import type { SubjectCelebrityCredit } from "@/modules/subject-celebrities/domain";
import { SafeImage } from "@/shared/components/common/safe-image";

type NameHierarchy = {
  original: string | null;
  primary: string;
};

type CreditPresentation = {
  character: NameHierarchy | null;
  detail: string | null;
  title: string;
};

const chineseLabel = (label: string): string => {
  const latinIndex = label.search(/\p{Script=Latin}/u);

  if (latinIndex < 0) {
    return label;
  }

  return label.slice(0, latinIndex).trim() || label;
};

const nameHierarchy = (name: string): NameHierarchy => {
  const latinIndex = name.search(/\p{Script=Latin}/u);

  if (latinIndex < 1) {
    return { original: null, primary: name };
  }

  return {
    original: name.slice(latinIndex).trim(),
    primary: name.slice(0, latinIndex).trim(),
  };
};

const creditPresentation = (
  credit: string | null
): CreditPresentation | null => {
  if (!credit) {
    return null;
  }

  const parentheticalDetail = credit.match(/\s*\((?<detail>[^)]+)\)\s*$/u);
  const title = chineseLabel(
    parentheticalDetail
      ? credit.slice(0, parentheticalDetail.index).trim()
      : credit
  );
  const detail = parentheticalDetail?.groups?.detail ?? null;
  const characterName = detail?.match(/^饰\s+(?<name>.+)$/u)?.groups?.name;

  return {
    character: characterName ? nameHierarchy(characterName) : null,
    detail,
    title,
  };
};

const CreditAvatar = ({
  avatar,
  name,
}: Pick<SubjectCelebrityCredit, "avatar" | "name">) => (
  <SafeImage
    alt={`${name}的头像`}
    className="atv-credit-avatar"
    fallback={<div aria-hidden="true" class="atv-credit-avatar is-empty" />}
    src={avatar}
  />
);

const CreditName = ({ name }: Pick<SubjectCelebrityCredit, "name">) => {
  const displayName = nameHierarchy(name);

  return (
    <span class="atv-credit-name">
      <span class="atv-credit-name-primary">{displayName.primary}</span>
      {displayName.original ? (
        <span class="atv-credit-name-original">{displayName.original}</span>
      ) : null}
    </span>
  );
};

const CreditRole = ({ credit }: Pick<SubjectCelebrityCredit, "credit">) => {
  const displayCredit = creditPresentation(credit);

  if (!displayCredit) {
    return null;
  }

  if (displayCredit.character) {
    return (
      <div class="atv-credit-role">
        <span class="atv-credit-role-title">{displayCredit.title}</span>
        <span class="atv-credit-character">
          <span class="atv-credit-character-prefix">饰</span>
          <span class="atv-credit-character-name">
            {displayCredit.character.primary}
          </span>
          {displayCredit.character.original ? (
            <span class="atv-credit-character-original">
              {displayCredit.character.original}
            </span>
          ) : null}
        </span>
      </div>
    );
  }

  return (
    <div class="atv-credit-role">
      <span class="atv-credit-role-title">{displayCredit.title}</span>
      {displayCredit.detail ? (
        <span class="atv-credit-role-detail">{displayCredit.detail}</span>
      ) : null}
    </div>
  );
};

const CreditIdentity = ({
  avatar,
  credit,
  href,
  name,
}: SubjectCelebrityCredit) => {
  const portrait = <CreditAvatar avatar={avatar} name={name} />;

  return (
    <div class="atv-credit-identity">
      {href ? (
        <a
          aria-label={`在新标签页查看${name}`}
          class="atv-credit-person"
          href={href}
          rel="noreferrer"
          target="_blank"
        >
          {portrait}
          <CreditName name={name} />
        </a>
      ) : (
        <div class="atv-credit-person is-static">
          {portrait}
          <CreditName name={name} />
        </div>
      )}
      <CreditRole credit={credit} />
    </div>
  );
};

const CreditCard = ({ credit }: { credit: SubjectCelebrityCredit }) => (
  <article class="atv-credit-card">
    <CreditIdentity {...credit} />
    {credit.works.length > 0 ? (
      <div class="atv-credit-works">
        <span>代表作</span>
        <div>
          {credit.works.map((work, index) => (
            <a
              class="atv-credit-work"
              href={work.href}
              key={`${work.href}-${index}`}
              rel="noreferrer"
              target="_blank"
            >
              {work.title}
            </a>
          ))}
        </div>
      </div>
    ) : null}
  </article>
);

export { CreditCard, chineseLabel };
