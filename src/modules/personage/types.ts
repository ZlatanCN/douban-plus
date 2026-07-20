type PersonageFact = {
  label: string;
  value: string;
};

type PersonageProfile = {
  biography: string[] | null;
  facts: PersonageFact[];
  id: string;
  name: string;
  portrait: string | null;
};

export type { PersonageFact, PersonageProfile };
