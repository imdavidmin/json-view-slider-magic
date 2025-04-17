
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

const JSONViewer = () => {
  const [inputJSON, setInputJSON] = useState("");
  const [nestLevel, setNestLevel] = useState([3]);
  const [error, setError] = useState<string | null>(null);

  const formatJSON = (obj: any, level: number = 0, maxLevel: number): string => {
    if (level >= maxLevel) {
      // Collapse to single line for deeper levels
      return JSON.stringify(obj);
    }

    if (typeof obj !== "object" || obj === null) {
      return JSON.stringify(obj);
    }

    const indent = "  ".repeat(level);
    const nextIndent = "  ".repeat(level + 1);

    if (Array.isArray(obj)) {
      if (obj.length === 0) return "[]";
      const items = obj
        .map((item) => nextIndent + formatJSON(item, level + 1, maxLevel))
        .join(",\n");
      return `[\n${items}\n${indent}]`;
    }

    const entries = Object.entries(obj);
    if (entries.length === 0) return "{}";
    
    const items = entries
      .map(([key, value]) => {
        return `${nextIndent}"${key}": ${formatJSON(value, level + 1, maxLevel)}`;
      })
      .join(",\n");
    return `{\n${items}\n${indent}}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputJSON(e.target.value);
    setError(null);
  };

  const getFormattedJSON = () => {
    if (!inputJSON.trim()) return "";
    try {
      const parsed = JSON.parse(inputJSON);
      return formatJSON(parsed, 0, nestLevel[0]);
    } catch (err) {
      setError("Invalid JSON format");
      return "";
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <Card className="bg-white shadow-lg rounded-lg p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-gray-700">
              Nesting Level: {nestLevel[0]}
            </label>
            <div className="w-64">
              <Slider
                value={nestLevel}
                onValueChange={setNestLevel}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
          </div>
          
          <textarea
            className="w-full h-40 p-3 border rounded-lg font-mono text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Paste your JSON here..."
            onChange={handleInputChange}
            value={inputJSON}
          />
          
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>

        <ScrollArea className="h-[400px] rounded-md border bg-gray-50 p-4">
          <pre className="font-mono text-sm whitespace-pre">
            {getFormattedJSON()}
          </pre>
        </ScrollArea>
      </Card>
    </div>
  );
};

export default JSONViewer;
