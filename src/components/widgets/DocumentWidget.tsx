"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import LineChartWidget from "../widgets/LineChartWidget";
import BarChartWidget from "../widgets/BarChartWidget";
import PieChartWidget from "../widgets/PieChartWidget";
import { DocumentPayload } from "@/types/types";
import { Loader2 } from "lucide-react";

export default function DocumentWidget({
  filename,
  fileId,
  uri,
  mimeType,
  fields = [],
  preview = [],
  rowCount = 0,
  insights,
  chart,
}: DocumentPayload) {
  const hasPreview = fields.length > 0 && preview.length > 0;

  return (
    <Card className="w-full h-full overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Document: {filename ?? "Unknown"}{" "}
          {rowCount > 0 && (
            <span className="text-muted-foreground">({rowCount} rows)</span>
          )}
        </CardTitle>

        {(fileId || uri || mimeType) && (
          <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
            {fileId && <p>File ID: {fileId}</p>}
            {uri && (
              <p className="truncate">
                URI:{" "}
                <a
                  href={uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-600 hover:text-blue-800"
                >
                  {uri}
                </a>
              </p>
            )}
            {mimeType && <p>MIME: {mimeType}</p>}
          </div>
        )}
      </CardHeader>

      <CardContent className="overflow-auto max-h-80 space-y-4">
        {/* Render chart if present */}
        {chart && (
          <div className="w-full h-72 mb-4">
            {chart.type === "line" && (
              <LineChartWidget data={chart.data} title={chart.title} />
            )}
            {chart.type === "bar" && (
              <BarChartWidget data={chart.data} title={chart.title} />
            )}
            {chart.type === "pie" && (
              <PieChartWidget data={chart.data} title={chart.title} />
            )}
          </div>
        )}

        {/* Table preview */}
        {!chart && hasPreview && (
          <table className="w-full text-sm border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                {fields.map((f) => (
                  <th
                    key={f}
                    className="border border-gray-300 px-2 py-1 text-left"
                  >
                    {f}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.slice(0, 20).map((row, i) => (
                <tr key={i} className="even:bg-gray-50">
                  {fields.map((f) => (
                    <td
                      key={f}
                      className="border border-gray-300 px-2 py-1 truncate max-w-[120px]"
                      title={
                        row[f] !== null && row[f] !== undefined
                          ? String(row[f])
                          : ""
                      }
                    >
                      {row[f] !== null && row[f] !== undefined
                        ? String(row[f])
                        : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Insights */}
        {insights && (
          <div className="p-3 border rounded bg-gray-50">
            <h3 className="text-sm font-semibold mb-2">AI Insights</h3>
            {insights === "Analyzing with Gemini..." ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{insights}</span>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{insights}</p>
            )}
          </div>
        )}

        {!chart && !hasPreview && !insights && (
          <p className="text-sm text-muted-foreground">
            No preview, chart, or insights available yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
