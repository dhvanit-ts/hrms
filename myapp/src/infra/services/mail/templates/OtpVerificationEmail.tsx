import React from "react";
import { Heading, Row, Section, Text } from "@react-email/components";
import BaseLayout from "./components/BaseLayout.js";

void React;

interface VerificationEmailProps {
  username: string;
  otp: string;
  projectName: string;
}

export default function VerificationEmail({
  username,
  otp,
  projectName,
}: VerificationEmailProps) {
  return (
    <BaseLayout projectName={projectName}>
      <Section>
        <Row>
          <Heading as="h2">Hello {username},</Heading>
        </Row>
        <Row>
          <Text>
            Thank you for registering. Please use the following verification
            code to complete your registration:
          </Text>
        </Row>
        <Row>
          <Text style={style.otpText}>
            {otp}
          </Text>
        </Row>
        <Row>
          <Text style={style.bottomText}>
            If you did not request this code, please ignore this email.
          </Text>
        </Row>
        {/* Uncomment if you want a verify button */}
        {/* <Row>
          <Button
            href={`http://localhost:3000/verify/${username}`}
            style={style.button}
          >
            Verify here
          </Button>
        </Row> */}
      </Section>
    </BaseLayout>
  );
};

const style = {
  otpText: { fontSize: "20px", fontWeight: "bold", marginTop: "10px" },
  bottomText: { marginTop: "10px" },
  button: { color: '#61dafb', marginTop: '10px' }
};
