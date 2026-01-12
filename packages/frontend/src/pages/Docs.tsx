import { BookOpen } from "lucide-react";

export function DocsPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center">
        <BookOpen className="w-8 h-8 text-primary-400" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-surface-100">Documentation</h1>
        <p className="text-surface-400 mt-2 max-w-md">
          User guides, API documentation, and IP-XACT standards reference will appear here.
        </p>
      </div>
    </div>
  );
}
