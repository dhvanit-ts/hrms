import React from "react";
import { Section, Text } from "@react-email/components";
import BaseLayout from "../components/BaseLayout.js";

void React;

export default function NewDeviceLoginEmail({
  deviceName,
  location,
  projectName,
}: {
  deviceName: string;
  location: string;
  projectName: string;
}) {
  return (
    <BaseLayout projectName={projectName}>
      <Section>
        <Text style={style.text}>⚠️ New Device Login Detected</Text>
        <Text><b>Device:</b> {deviceName}</Text>
        <Text><b>Location:</b> {location}</Text>
      </Section>
    </BaseLayout>
  );
};

const style = {
  text: { fontSize: "18px", fontWeight: "bold" }
};
