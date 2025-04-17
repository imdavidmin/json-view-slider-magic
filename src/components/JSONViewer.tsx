
import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";

const JSONViewer = () => {
  const [jsonContent, setJsonContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [maxDepth, setMaxDepth] = useState(1);
  const [nestLevel, setNestLevel] = useState([1]);

  const calculateJsonDepth = (obj: any): number => {
    if (typeof obj !== "object" || obj === null) return 0;
    return 1 + Math.max(0, ...Object.values(obj).map(calculateJsonDepth));
  };

  const formatWithSyntaxHighlighting = (text: string, level: number = 0): JSX.Element => {
    try {
      if (!text.trim()) return <></>;
      
      const parsed = JSON.parse(text);
      const formatted = formatJSON(parsed, 0, nestLevel[0]);
      
      return (
        <span>
          {formatted.split(/([{}[\],":])/).map((part, index) => {
            if (part.trim() === "") return null;
            
            // Determine the color based on the content
            let className = "";
            if (part === "{" || part === "}" || part === "[" || part === "]") {
              className = "text-purple-400"; // Braces
            } else if (part === "," || part === ":") {
              className = "text-gray-400"; // Separators
            } else if (part.startsWith('"')) {
              if (/"[^"]*":/.test(part)) {
                className = "text-cyan-300"; // Keys
              } else {
                className = "text-green-300"; // String values
              }
            } else if (!isNaN(Number(part))) {
              className = "text-yellow-300"; // Numbers
            }
            
            return (
              <span key={index} className={className}>
                {part}
              </span>
            );
          })}
        </span>
      );
    } catch (err) {
      return <span>{text}</span>;
    }
  };

  const formatJSON = (obj: any, level: number = 0, maxLevel: number): string => {
    if (level >= maxLevel) {
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
        .map((item) => nextIndent + JSON.stringify(item))
        .join(",\n");
      return `[\n${items}\n${indent}]`;
    }

    const entries = Object.entries(obj);
    if (entries.length === 0) return "{}";
    
    const items = entries
      .map(([key, value]) => `${nextIndent}"${key}": ${formatJSON(value, level + 1, maxLevel)}`)
      .join(",\n");
    return `{\n${items}\n${indent}}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setJsonContent(newContent);
    setError(null);

    try {
      if (newContent.trim()) {
        const parsed = JSON.parse(newContent);
        const depth = calculateJsonDepth(parsed);
        setMaxDepth(depth);
        setNestLevel([Math.min(nestLevel[0], depth)]);
      }
    } catch (err) {
      setError("Invalid JSON format");
    }
  };

  return (
    <div className="h-screen w-screen p-4 bg-gray-900">
      <Card className="h-full bg-gray-800 border-gray-700">
        <div className="flex flex-col h-full p-6 space-y-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-300 min-w-32">
              Nesting Level: {nestLevel[0]} / {maxDepth}
            </label>
            <Slider
              value={nestLevel}
              onValueChange={setNestLevel}
              max={maxDepth}
              min={1}
              step={1}
              className="w-64"
              disabled={maxDepth <= 1}
            />
          </div>

          <div className="relative flex-grow">
            <textarea
              className="absolute inset-0 w-full h-full p-4 font-mono text-sm bg-gray-900 text-gray-300 border border-gray-700 rounded-lg resize-none"
              placeholder="Paste your JSON here..."
              onChange={handleInputChange}
              value={jsonContent}
            />
            <pre className="absolute inset-0 w-full h-full p-4 font-mono text-sm pointer-events-none overflow-auto">
              {formatWithSyntaxHighlighting(jsonContent)}
            </pre>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default JSONViewer;
