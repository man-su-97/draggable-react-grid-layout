"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentPreviewRow } from "@/types/types";

interface DocumentWidgetProps {
  filename?: string;
  fields?: string[];
  rowCount?: number;
  preview?: DocumentPreviewRow[];
  summary?: string;
  loading?: boolean;
}

export default function DocumentWidget({
  filename,
  fields,
  rowCount,
  preview,
  summary,
  loading,
}: DocumentWidgetProps) {
  // Loading state
  if (loading) {
    return (
      <Card className="w-full h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          ⏳ Analyzing {filename ?? "document"}…
        </p>
      </Card>
    );
  }

  const hasSummary = !!summary;
  const hasPreview = !!fields?.length && !!preview?.length;

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>📄 {filename ?? "Document"}</span>
          {rowCount !== undefined && (
            <span className="text-sm text-muted-foreground">{rowCount} rows</span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto space-y-4">
        {/* Summary Section */}
        {hasSummary && (
          <div className="p-3 rounded border bg-muted text-sm leading-relaxed whitespace-pre-wrap">
            {summary}
          </div>
        )}

        {/* Preview Table */}
        {hasPreview ? (
          <div className="overflow-x-auto border rounded">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  {fields.map((field) => (
                    <th
                      key={field}
                      className="border border-border px-2 py-1 text-left font-medium text-muted-foreground"
                    >
                      {field}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr
                    key={i}
                    className="even:bg-muted/30 hover:bg-muted/40 transition-colors"
                  >
                    {fields.map((field) => (
                      <td
                        key={field}
                        className="border border-border px-2 py-1 truncate max-w-[180px]"
                        title={String(row[field] ?? "")}
                      >
                        {String(row[field] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !hasSummary ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No summary or preview data available.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
