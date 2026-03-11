export interface ElementBase {
  id: string;
  name?: string;
  names?: Record<string, string>;
  description?: string;
  descriptions?: Record<string, string>;
}

export interface Link {
  href?: string;
  hreflang?: string;
  rel: string;
  title?: string;
  titles?: Record<string, string>;
  type?: string;
  uri?: string;
  urn?: string;
}

export interface Annotation {
  id?: string;
  links?: Link[];
  text?: string;
  texts?: Record<string, string>;
  title?: string;
  type?: string;
  value?: string;
}
