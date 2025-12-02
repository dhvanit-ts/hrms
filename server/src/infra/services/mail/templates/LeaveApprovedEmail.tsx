import React from "react";
import { Section, Text } from "@react-email/components";
import BaseLayout from "./components/BaseLayout.js";

void React;

interface LeaveApprovedEmailProps {
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    approverName: string;
    projectName: string;
}

export default function LeaveApprovedEmail({
    employeeName,
    leaveType,
    startDate,
    endDate,
    approverName,
    projectName,
}: LeaveApprovedEmailProps) {
    return (
        <BaseLayout projectName={projectName}>
            <Section>
                <Text style={style.heading}>Leave Request Approved ✓</Text>
                <Text>Hi {employeeName},</Text>
                <Text>
                    Your leave request has been approved by {approverName}.
                </Text>
                <Section style={style.detailsBox}>
                    <Text style={style.detailLabel}>Leave Type:</Text>
                    <Text style={style.detailValue}>{leaveType}</Text>
                    <Text style={style.detailLabel}>Start Date:</Text>
                    <Text style={style.detailValue}>{startDate}</Text>
                    <Text style={style.detailLabel}>End Date:</Text>
                    <Text style={style.detailValue}>{endDate}</Text>
                </Section>
                <Text>
                    Your leave has been recorded in the system. Enjoy your time off!
                </Text>
            </Section>
        </BaseLayout>
    );
}

const style = {
    heading: {
        fontSize: "20px",
        fontWeight: "bold",
        color: "#16a34a",
        marginBottom: "16px",
    },
    detailsBox: {
        backgroundColor: "#f9fafb",
        padding: "16px",
        borderRadius: "6px",
        margin: "16px 0",
    },
    detailLabel: {
        fontSize: "12px",
        color: "#6b7280",
        fontWeight: "600",
        marginBottom: "4px",
        marginTop: "8px",
    },
    detailValue: {
        fontSize: "14px",
        color: "#111827",
        marginBottom: "0px",
    },
};
