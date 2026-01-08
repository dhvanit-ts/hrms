// postTopics.ts
export const PostTopic = [
  "Ask Flick",
  "Serious Discussion",
  "Career Advice",
  "Showcase",
  "Off-topic",
  "Community Event",
  "Rant / Vent",
  "Help / Support",
  "Feedback / Suggestion",
  "News / Update",
  "Guide / Resource"
] as const;

export type TPostTopic = typeof PostTopic[number];
