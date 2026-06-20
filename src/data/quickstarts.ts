import quickstarts from './quickstarts.json';

export interface Quickstart {
  name: string;
  title: string;
  blurb: string;
  experimental?: boolean;
}

export interface QuickstartGroup {
  key: string;
  blurb: string;
  items: Quickstart[];
}

// Card metadata for the runnable quickstarts. Single source of truth for both
// the /quickstart index and the /quickstart/<name> detail pages — authored in
// docs/site/web/quickstarts.json and synced to ./quickstarts.json. The page
// BODY (Goals/Result) is synced separately; this is just titles/blurbs/grouping.
export const groups: QuickstartGroup[] = quickstarts.groups;

export const allQuickstarts: Quickstart[] = groups.flatMap((g) => g.items);

export const docsUrl = (name: string) => `https://docs.getsqe.com/quickstart/${name}.html`;
export const repoUrl = (name: string) => `https://github.com/schubergphilis/sqe/tree/main/quickstart/${name}/`;
