import { useState } from "preact/hooks";

import type { PersonageProfile } from "./types";

type PersonagePageProps = {
  profile: PersonageProfile;
};

const PersonagePage = ({ profile }: PersonagePageProps) => {
  const [biographyExpanded, setBiographyExpanded] = useState(false);

  return (
    <main class="atv-personage">
      <section class="atv-personage-hero">
        {profile.portrait ? (
          <img alt="" class="atv-personage-portrait" src={profile.portrait} />
        ) : (
          <div aria-hidden="true" class="atv-personage-portrait is-empty" />
        )}
        <div class="atv-personage-identity">
          <p class="atv-personage-kicker">人物</p>
          <h1>{profile.name}</h1>
          {profile.facts.length > 0 ? (
            <dl class="atv-personage-facts">
              {profile.facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {profile.biography?.length ? (
            <div class="atv-personage-biography">
              <div class={biographyExpanded ? "is-expanded" : "is-clamped"}>
                {profile.biography.map((paragraph, index) => (
                  <p key={`${index}-${paragraph}`}>{paragraph}</p>
                ))}
              </div>
              <button
                aria-expanded={biographyExpanded}
                onClick={() => setBiographyExpanded((expanded) => !expanded)}
                type="button"
              >
                {biographyExpanded ? "收起" : "展开"}
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
};

export { PersonagePage };
export type { PersonagePageProps };
