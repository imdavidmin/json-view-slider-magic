
import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { ScrollArea } from "@/components/ui/scroll-area";
import { oneDark } from "@codemirror/theme-one-dark";

const JSONViewer = () => {
  const [jsonContent, setJsonContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [maxDepth, setMaxDepth] = useState(1);
  const [nestLevel, setNestLevel] = useState([1]);
  const [formattedJson, setFormattedJson] = useState("");

  const calculateJsonDepth = (obj: any): number => {
    if (typeof obj !== "object" || obj === null) return 0;
    return 1 + Math.max(0, ...Object.values(obj).map(calculateJsonDepth));
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
        .map((item) => nextIndent + formatJSON(item, level + 1, maxLevel))
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

  useEffect(() => {
    try {
      if (!jsonContent.trim()) {
        setFormattedJson("");
        setError(null);
        return;
      }
      
      const parsed = JSON.parse(jsonContent);
      const depth = calculateJsonDepth(parsed);
      setMaxDepth(Math.max(1, depth));
      setNestLevel([Math.min(nestLevel[0], depth || 1)]);
      
      const formatted = formatJSON(parsed, 0, nestLevel[0]);
      setFormattedJson(formatted);
      setError(null);
    } catch (err) {
      setError("Invalid JSON format");
      setFormattedJson(jsonContent);
    }
  }, [jsonContent, nestLevel]);

  const handleInputChange = (value: string) => {
    setJsonContent(value);
  };

  const jsonLanguageExtension = json();

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

          <ScrollArea className="h-full">
            <CodeMirror
              value={formattedJson}
              onChange={handleInputChange}
              height="100%"
              extensions={[jsonLanguageExtension]}
              theme={oneDark}
              basicSetup={{
                lineNumbers: true,
                highlightActiveLine: true,
                highlightSpecialChars: true,
                foldGutter: true,
                indentOnInput: true,
                syntaxHighlighting: true,
              }}
              className={error ? "border border-red-500 rounded-md" : ""}
            />
          </ScrollArea>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default JSONViewer;
