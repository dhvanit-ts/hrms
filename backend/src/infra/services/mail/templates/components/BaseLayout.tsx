import React from "react";
import {
  Body,
  Container,
  Head,
  Html,
  Section,
  Text,
} from "@react-email/components";

void React;

interface BaseLayoutProps {
  projectName: string;
  children: React.ReactNode;
}

export default function BaseLayout({ projectName, children }: BaseLayoutProps) {
  return (
    <Html>
      <Head />
      <Body style={style.body}>
        <Container
          style={style.container}
        >
          <Section
            style={style.topSection}
          >
            <Text style={style.topText}>
              {projectName}
            </Text>
          </Section>
          {children}
          <Section
            style={style.bottomSection}
          >
            <Text style={style.bottomText}>
              © {new Date().getFullYear()} {projectName}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const style = {
  body: {
    backgroundColor: "#f4f4f5",
    fontFamily: "sans-serif"
  },
  container: {
    margin: "20px auto",
    maxWidth: "600px",
    background: "#fff",
    borderRadius: "8px",
    padding: "20px",
  },
  bottomSection: {
    borderTop: "1px solid #eee",
    marginTop: "20px",
    paddingTop: "10px",
  },
  topSection: { borderBottom: "1px solid #eee", marginBottom: "20px" },
  bottomText: { fontSize: "12px", color: "#888" },
  topText: { fontSize: "20px", fontWeight: "bold" }
};