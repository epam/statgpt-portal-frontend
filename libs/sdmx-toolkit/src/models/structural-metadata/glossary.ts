import { CodelistItemBase } from './hierarchy';

export interface Glossary {
  id: string;
  agencyID?: string;
  version?: string;
  name?: string;
  terms?: CodelistItemBase[];
}
