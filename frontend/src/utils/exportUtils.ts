import { jsPDF } from 'jspdf';
import { ChatMessage } from '../types';

export const exportToMarkdown = (messages: ChatMessage[], title: string = 'RAG Document Reader Conversation') => {
  let content = `# ${title}\n\nExported on: ${new Date().toLocaleString()}\n\n---\n\n`;

  messages.forEach((msg, idx) => {
    const roleName = msg.role === 'user' ? '👤 User' : '🤖 AI Assistant';
    content += `### ${roleName} (${msg.timestamp})\n\n${msg.content}\n\n`;

    if (msg.sources && msg.sources.length > 0) {
      content += `**Retrieved Sources:**\n`;
      msg.sources.forEach((src) => {
        content += `- **${src.source}** (Similarity Score: ${(src.score * 100).toFixed(1)}%)\n  *Snippet:* ${src.snippet.replace(/\n/g, ' ')}\n`;
      });
      content += `\n`;
    }
    content += `---\n\n`;
  });

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `rag-chat-export-${Date.now()}.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (messages: ChatMessage[], title: string = 'RAG Document Reader Conversation') => {
  const doc = new jsPDF();
  let yPosition = 15;
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxLineWidth = pageWidth - margin * 2;

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, margin, yPosition);
  yPosition += 8;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Exported: ${new Date().toLocaleString()}`, margin, yPosition);
  yPosition += 12;

  messages.forEach((msg) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 15;
    }

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(msg.role === 'user' ? 37 : 124, msg.role === 'user' ? 99 : 58, msg.role === 'user' ? 235 : 237);
    const roleHeader = `${msg.role === 'user' ? 'User' : 'Assistant'} [${msg.timestamp}]`;
    doc.text(roleHeader, margin, yPosition);
    yPosition += 6;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30);

    const splitText = doc.splitTextToSize(msg.content, maxLineWidth);
    splitText.forEach((line: string) => {
      if (yPosition > 275) {
        doc.addPage();
        yPosition = 15;
      }
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });

    yPosition += 6;
  });

  doc.save(`rag-chat-export-${Date.now()}.pdf`);
};
