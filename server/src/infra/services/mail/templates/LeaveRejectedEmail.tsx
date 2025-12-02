import React from "react";
import { Section, Text } from "@react-email/components";
import BaseLayout from "./components/BaseLayout.js";

void React;

interface LeaveRejectedEmailProps {
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    approverName: string;
    reason?: string;
    projectName: string;
}

export default function LeaveRejectedEmail({
    employeeName,
    leaveType,
    startDate,
    endDate,
    approverName,
    reason,
    projectName,
}: LeaveRejectedEmailProps) {
    return (
        <BaseLayout projectName={projectName}>
            <Section>
                <Text style={style.heading}>Leave Request Rejected</Text>
                <Text>Hi {employeeName},</Text>
                <Text>
                    Your leave request has been rejected by {approverName}.
                </Text>
                <Section style={style.detailsBox}>
                    <Text style={style.detailLabel}>Leave Type:</Text>
                    <Text style={style.detailValue}>{leaveType}</Text>
                    <Text style={style.detailLabel}>Start Date:</Text>
                    <Text style={style.detailValue}>{startDate}</Text>
                    <Text style={style.detailLabel}>End Date:</Text>
                    <Text style={style.detailValue}>{endDate}</Text>
                    {reason && (
                        <>
                            <Text style={style.detailLabel}>Reason:</Text>
                            <Text style={style.detailValue}>{reason}</Text>
                        </>
                    )}
                </Section>
                <Text>
                    If you have any questions, please contact your manager or HR department.
                </Text>
            </Section>
        </BaseLayout>
    );
}

const style = {
    heading: {
        fontSize: "20px",
        fontWeight: "bold",
        color: "#dc2626",
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
