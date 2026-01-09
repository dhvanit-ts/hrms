import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface TicketRejectedEmailProps {
  employeeName: string;
  ticketNumber: string;
  ticketType: string;
  ticketTitle: string;
  approverName: string;
  approverNotes?: string;
  dashboardUrl?: string;
}

export const TicketRejectedEmail = ({
  employeeName = "John Doe",
  ticketNumber = "TKT-001",
  ticketType = "Attendance Correction",
  ticketTitle = "Late Check-in Request",
  approverName = "Manager",
  approverNotes,
  dashboardUrl = "https://hrms.company.com/employee/tickets",
}: TicketRejectedEmailProps) => (
  <Html>
    <Head />
    <Preview>Your ticket {ticketNumber} has been rejected</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Ticket Rejected</Heading>

        <Text style={text}>Hi {employeeName},</Text>

        <Text style={text}>
          We regret to inform you that your ticket has been rejected.
        </Text>

        <Section style={ticketDetails}>
          <Text style={detailLabel}>Ticket Number:</Text>
          <Text style={detailValue}>{ticketNumber}</Text>

          <Text style={detailLabel}>Type:</Text>
          <Text style={detailValue}>{ticketType}</Text>

          <Text style={detailLabel}>Title:</Text>
          <Text style={detailValue}>{ticketTitle}</Text>

          <Text style={detailLabel}>Reviewed by:</Text>
          <Text style={detailValue}>{approverName}</Text>
        </Section>

        {approverNotes && (
          <>
            <Hr style={hr} />
            <Section>
              <Text style={detailLabel}>Reason for Rejection:</Text>
              <Text style={text}>{approverNotes}</Text>
            </Section>
          </>
        )}

        <Hr style={hr} />

        <Text style={text}>
          If you believe this decision was made in error or if you have additional
          information to support your request, please feel free to create a new ticket
          or contact HR directly.
        </Text>

        {dashboardUrl && (
          <Section style={buttonContainer}>
            <Button style={button} href={dashboardUrl}>
              View Dashboard
            </Button>
          </Section>
        )}

        <Text style={footer}>
          Best regards,<br />
          HR Team
        </Text>
      </Container>
    </Body>
  </Html>
);

export default TicketRejectedEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
  textAlign: "center" as const,
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 8px",
};

const ticketDetails = {
  backgroundColor: "#f8f9fa",
  border: "1px solid #e9ecef",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 8px",
};

const detailLabel = {
  color: "#6c757d",
  fontSize: "14px",
  fontWeight: "bold",
  margin: "8px 0 4px 0",
};

const detailValue = {
  color: "#333",
  fontSize: "16px",
  margin: "0 0 12px 0",
};

const hr = {
  borderColor: "#e9ecef",
  margin: "20px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#dc3545",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const footer = {
  color: "#6c757d",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "32px 8px 0 8px",
};