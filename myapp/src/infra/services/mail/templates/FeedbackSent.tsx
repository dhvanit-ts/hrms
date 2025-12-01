import React from "react";
import { Section, Text } from "@react-email/components";
import BaseLayout from "./components/BaseLayout.js";

void React;

export default function FeedbackSentEmail({
  title,
  description,
  sendBy,
  projectName,
}: {
  title: string;
  description: string;
  sendBy: string;
  projectName: string;
}) {
  return (
    <BaseLayout projectName={projectName}>
      <Section>
        <Text style={style.topText}>{title}</Text>
        <Text>{description}</Text>
        <Text style={style.bottomText}>— {sendBy}</Text>
      </Section>
    </BaseLayout>
  );
};

const style = {
  topText: { fontSize: "18px", fontWeight: "bold" },
  bottomText: { marginTop: "10px", fontStyle: "italic" }
};
