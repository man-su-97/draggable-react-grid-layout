import FileInsightTester from "@/components/dashboard/PdfInsightTester";
import type { NextPage } from "next";

const PdfTesterPage: NextPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <FileInsightTester />
    </div>
  );
};

export default PdfTesterPage;
