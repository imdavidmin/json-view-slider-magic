
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

  const formatWithSyntaxHighlighting = (text: string): JSX.Element | null => {
    try {
      if (!text.trim()) return null;
      
      const parsed = JSON.parse(text);
      const formatted = formatJSON(parsed, 0, nestLevel[0]);
      
      // Process the formatted text to identify special tokens
      const tokens: { content: string; type: string }[] = [];
      let inString = false;
      let isKey = false;
      let currentToken = "";
      let i = 0;
      
      while (i < formatted.length) {
        const char = formatted[i];
        
        if (char === '"' && (i === 0 || formatted[i - 1] !== '\\')) {
          // Handle string start/end
          if (inString) {
            currentToken += char;
            tokens.push({ 
              content: currentToken, 
              type: isKey ? "key" : "string" 
            });
            currentToken = "";
            inString = false;
            
            // Check if this string is followed by a colon (making it a key)
            let j = i + 1;
            while (j < formatted.length && /\s/.test(formatted[j])) j++;
            isKey = j < formatted.length && formatted[j] === ':';
          } else {
            if (currentToken) {
              tokens.push({ content: currentToken, type: "other" });
              currentToken = "";
            }
            currentToken = char;
            inString = true;
            
            // Check if previous non-whitespace was a colon
            let j = i - 1;
            while (j >= 0 && /\s/.test(formatted[j])) j--;
            isKey = j < 0 || formatted[j] !== ':';
          }
        } else if (!inString && (char === '{' || char === '}' || char === '[' || char === ']')) {
          // Handle braces
          if (currentToken) {
            tokens.push({ content: currentToken, type: "other" });
            currentToken = "";
          }
          tokens.push({ content: char, type: "brace" });
        } else if (!inString && (char === ',' || char === ':')) {
          // Handle separators
          if (currentToken) {
            tokens.push({ content: currentToken, type: "other" });
            currentToken = "";
          }
          tokens.push({ content: char, type: "separator" });
        } else {
          currentToken += char;
          
          // Check for special values (true, false, null, numbers)
          if (!inString && 
              (currentToken === "true" || 
               currentToken === "false" || 
               currentToken === "null" || 
               /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(currentToken)) &&
              (i + 1 === formatted.length || /[\s,\]\}]/.test(formatted[i + 1]))
          ) {
            let type = "other";
            if (currentToken === "null") type = "null";
            else if (currentToken === "true" || currentToken === "false") type = "boolean";
            else if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(currentToken)) type = "number";
            
            tokens.push({ content: currentToken, type });
            currentToken = "";
          }
        }
        i++;
      }
      
      if (currentToken) {
        tokens.push({ content: currentToken, type: "other" });
      }
      
      return (
        <div className="font-mono text-sm whitespace-pre">
          {tokens.map((token, index) => {
            // Assign colors based on token type
            let className = "";
            switch (token.type) {
              case "key":
                className = "text-cyan-300"; // Keys
                break;
              case "string":
                className = "text-green-300"; // String values
                break;
              case "number":
                className = "text-yellow-300"; // Numbers
                break;
              case "boolean":
                className = "text-purple-300"; // true/false
                break;
              case "null":
                className = "text-gray-400"; // null
                break;
              case "brace":
                className = "text-purple-400"; // Braces
                break;
              case "separator":
                className = "text-gray-400"; // Separators
                break;
              default:
                className = "text-gray-300"; // Default text color
            }
            
            return (
              <span key={index} className={className}>
                {token.content}
              </span>
            );
          })}
        </div>
      );
    } catch (err) {
      // Show error in red for invalid JSON
      return <div className="text-red-400 font-mono text-sm">{text}</div>;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setJsonContent(newContent);
    setError(null);

    try {
      if (newContent.trim()) {
        const parsed = JSON.parse(newContent);
        const depth = calculateJsonDepth(parsed);
        setMaxDepth(Math.max(1, depth));
        setNestLevel([Math.min(nestLevel[0], depth || 1)]);
      } else {
        setMaxDepth(1);
        setNestLevel([1]);
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

          <div className="relative flex-grow overflow-hidden">
            <textarea
              className="absolute inset-0 w-full h-full p-4 font-mono text-sm bg-gray-800 text-gray-300 border border-gray-700 rounded-lg resize-none"
              placeholder="Paste your JSON here..."
              onChange={handleInputChange}
              value={jsonContent}
              spellCheck="false"
            />
            {jsonContent && (
              <div className="absolute inset-0 w-full h-full p-4 overflow-auto pointer-events-none">
                {formatWithSyntaxHighlighting(jsonContent) || (
                  <div className="text-gray-500 font-mono text-sm">Paste your JSON here...</div>
                )}
              </div>
            )}
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
