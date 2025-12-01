import React from "react";
import { Section, Text } from "@react-email/components";
import BaseLayout from "./components/BaseLayout.js";

void React;

export default function FeedbackReceivedEmail({ projectName }: { projectName: string }) {
  return (
    <BaseLayout projectName={projectName}>
      <Section>
        <Text style={style.topText}>🙏 Thanks for your feedback!</Text>
        <Text>We’ve received your message and will review it soon.</Text>
      </Section>
    </BaseLayout>
  );
};

const style = {
  topText: { fontSize: "16px" }
};
