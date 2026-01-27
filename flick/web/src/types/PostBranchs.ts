// postTopics.ts
export const PostBranches = [
  "BCA",
  "B.TECH",
  "B.COM",
  "BBA",
  "MBA",
  "MCA",
  "M.TECH",
  "M.COM",
  "MSC IT",
  "BSC IT",
  "MSC CS",
  "BSC CS",
  "MSC AI",
  "BSC AI"
] as const;

export type TPostBranch = typeof PostBranches[number];
