import { jsPDF } from "jspdf";

export type CertificateData = {
  participantName: string;
  eventTitle: string;
  organizerName: string;
  activityDate: string;
  activityHours: string;
  roleDescription: string;
  issueDate: string;
};

export function generateCertificatePdf(data: CertificateData): Blob {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text("活動証明書", 105, 30, { align: "center" });
  doc.setFontSize(12);
  doc.text(`氏名: ${data.participantName}`, 20, 50);
  doc.text(`イベント名: ${data.eventTitle}`, 20, 60);
  doc.text(`主催者: ${data.organizerName}`, 20, 70);
  doc.text(`活動日: ${data.activityDate}`, 20, 80);
  doc.text(`活動時間: ${data.activityHours}`, 20, 90);
  doc.text(`担当内容: ${data.roleDescription}`, 20, 100);
  doc.text(`発行日: ${data.issueDate}`, 20, 115);
  return doc.output("blob");
}
