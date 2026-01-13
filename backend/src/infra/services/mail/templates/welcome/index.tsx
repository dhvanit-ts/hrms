import React from "react";
import { Section, Text } from "@react-email/components";
import BaseLayout from "../components/BaseLayout.js";

void React;

export default function WelcomeEmail({ username, projectName }: { username: string; projectName: string }) {
  return (
    <BaseLayout projectName={projectName}>
      <Section>
        <Text style={style.topText}>Welcome, {username}!</Text>
        <Text>Thanks for joining {projectName}. We’re excited to have you 🚀</Text>
      </Section>
    </BaseLayout>
  );
};

const style = {
  topText: { fontSize: "18px", fontWeight: "bold" }
};
