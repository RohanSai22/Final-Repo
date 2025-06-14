import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  StopCircle,
  Brain,
  Cpu,
  Zap,
  Upload,
  XCircle,
  FileText,
  CheckCircle,
} from "lucide-react";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { motion } from "framer-motion"; // Import motion

interface WelcomeScreenProps {
  handleSubmit: (
    submittedInputValue: string,
    effort: string,
    model: string
  ) => void;
  onCancel: () => void;
  isLoading: boolean;
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  handleSubmit,
  onCancel,
  isLoading,
  uploadedFiles,
  setUploadedFiles,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalInputValue, setInternalInputValue] = useState("");
  const [effort, setEffort] = useState("medium");
  const [model, setModel] = useState("gemini-2.5-flash-preview-04-17");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInternalSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!internalInputValue.trim() && uploadedFiles.length === 0) return;
    handleSubmit(internalInputValue, effort, model);
    // setInternalInputValue(""); // Keep input value after submission for now, can be cleared if desired
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setUploadedFiles(Array.from(event.target.files));
    }
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles(uploadedFiles.filter((file) => file.name !== fileName));
  };

  const handleInternalKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleInternalSubmit();
    }
  };

  const isSubmitDisabled =
    (!internalInputValue.trim() && uploadedFiles.length === 0) || isLoading;

  // For TextGenerateEffect initial animation, if needed
  const [runTitleAnimation, setRunTitleAnimation] = useState(false);
  const [runSubtitleAnimation, setRunSubtitleAnimation] = useState(false);

  useEffect(() => {
    // Trigger animations shortly after component mounts
    const timer1 = setTimeout(() => setRunTitleAnimation(true), 100);
    const timer2 = setTimeout(() => setRunSubtitleAnimation(true), 300); // Stagger subtitle
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center px-4 flex-1 w-full max-w-4xl mx-auto gap-4 min-h-screen">
      {/* Novah Title Section */}
      <div className="relative mb-2">
        {/* Blurred background glow layers */}
        <div
          aria-hidden="true"
          className="absolute inset-0 text-purple-400 text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extralight tracking-[0.08em] leading-none filter blur-xl opacity-30 pointer-events-none"
        >
          Novah
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0 translate-x-1 translate-y-1 text-purple-600 text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extralight tracking-[0.08em] leading-none filter blur-2xl opacity-20 pointer-events-none"
        >
          Novah
        </div>

        {/* Main Title with TextGenerateEffect */}
        {runTitleAnimation && (
          <TextGenerateEffect
            words="Novah"
            className={`text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extralight mb-0 tracking-[0.08em] leading-none text-white transition-all duration-300 ${
              isFocused
                ? "drop-shadow-[0_0px_15px_rgba(255,255,255,0.3)]"
                : "drop-shadow-[0_0px_5px_rgba(255,255,255,0.1)]"
            }`}
          />
        )}
        {!runTitleAnimation && ( // Fallback if animation doesn't run
          <h1
            className={`text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extralight mb-0 tracking-[0.08em] leading-none text-white transition-all duration-300 ${
              isFocused
                ? "drop-shadow-[0_0px_15px_rgba(255,255,255,0.3)]"
                : "drop-shadow-[0_0px_5px_rgba(255,255,255,0.1)]"
            }`}
          >
            Novah
          </h1>
        )}
      </div>

      {/* Subtitle Section */}
      <div className="mb-10 h-8">
        {" "}
        {/* Added h-8 to reserve space and prevent layout shift */}
        {runSubtitleAnimation && (
          <TextGenerateEffect
            words="Your Advanced AI Agent"
            className="text-lg md:text-xl text-zinc-400 tracking-wider font-light"
          />
        )}
      </div>

      {/* Input Area Section */}
      <div className="relative w-full max-w-3xl mx-auto group mb-3">
        <div
          aria-hidden="true"
          className={`absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-xl blur-lg transition-all duration-500 group-hover:opacity-80 group-hover:scale-105 ${
            isFocused ? "opacity-80 scale-105" : "opacity-40"
          }`}
        ></div>
        <form
          onSubmit={handleInternalSubmit}
          className="relative flex flex-row items-center text-white rounded-xl bg-black/80 border border-zinc-700/50 p-2"
        >
          <Textarea
            value={internalInputValue}
            onChange={(e) => setInternalInputValue(e.target.value)}
            onKeyDown={handleInternalKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask Novah anything..."
            className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 text-base md:text-lg resize-none border-0 focus:outline-none focus:ring-0 focus-visible:ring-0 shadow-none p-3 pr-12 min-h-[50px] max-h-[200px] scrollbar-hide"
            rows={1}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isLoading ? (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-400 hover:bg-red-500/10 p-2 cursor-pointer rounded-full transition-all duration-200"
                  onClick={onCancel}
                  aria-label="Cancel"
                >
                  <StopCircle className="h-6 w-6" />
                </Button>
              </motion.div>
            ) : (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className={`${
                    isSubmitDisabled
                      ? "text-zinc-600 cursor-not-allowed"
                      : "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                  } p-2 rounded-full transition-all duration-200`}
                  disabled={isSubmitDisabled}
                  aria-label="Send"
                >
                  <Send className="h-6 w-6" />
                </Button>
              </motion.div>
            )}
          </div>
        </form>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-zinc-500 mb-8">
        Press Enter to send. Shift+Enter for new line.
      </p>

      {/* File Upload Section */}
      <div className="w-full max-w-3xl mx-auto mb-8">
        <div className="flex flex-col gap-4">
          {/* File Upload Button */}
          <div className="flex items-center justify-center gap-3">
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.txt,.doc,.docx"
            />
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-zinc-700 hover:bg-zinc-600 border-zinc-600 text-zinc-300 hover:text-zinc-200 text-sm px-4 py-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
            </motion.div>
            {uploadedFiles.length > 0 && (
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-400 text-sm"
                  onClick={() => setUploadedFiles([])}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </motion.div>
            )}
          </div>

          {/* Uploaded Files Display */}
          {uploadedFiles.length > 0 && (
            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <h4 className="text-sm font-medium text-zinc-300">
                  {uploadedFiles.length} file
                  {uploadedFiles.length !== 1 ? "s" : ""} uploaded
                </h4>
              </div>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-zinc-700/30 rounded-md p-2 border border-zinc-600/30"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                      <span className="text-xs text-zinc-300 truncate">
                        {file.name}
                      </span>
                      <span className="text-xs text-zinc-500 flex-shrink-0">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => removeFile(file.name)}
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </motion.div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-500 mt-3 text-center">
                Upload files first, then ask questions to get contextual answers
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Effort and Model Selectors */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-xl mx-auto mb-8">
        {/* Effort Select */}
        <div className="flex flex-row items-center gap-2 bg-zinc-800/70 border border-zinc-700/50 text-zinc-300 rounded-lg p-2 w-full sm:w-auto">
          <Brain className="h-5 w-5 text-purple-400" />
          <label htmlFor="effort-select" className="text-sm font-medium">
            Effort:
          </label>
          <Select value={effort} onValueChange={setEffort}>
            <SelectTrigger
              id="effort-select"
              className="w-full sm:w-[130px] bg-transparent border-none focus:ring-0 text-zinc-300 placeholder:text-zinc-500"
            >
              <SelectValue placeholder="Effort" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-300">
              <SelectItem
                value="low"
                className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
              >
                Low
              </SelectItem>
              <SelectItem
                value="medium"
                className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
              >
                Medium
              </SelectItem>
              <SelectItem
                value="high"
                className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
              >
                High
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Model Select */}
        <div className="flex flex-row items-center gap-2 bg-zinc-800/70 border border-zinc-700/50 text-zinc-300 rounded-lg p-2 w-full sm:w-auto">
          <Cpu className="h-5 w-5 text-blue-400" />
          <label htmlFor="model-select" className="text-sm font-medium">
            Model:
          </label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger
              id="model-select"
              className="w-full sm:w-[220px] bg-transparent border-none focus:ring-0 text-zinc-300 placeholder:text-zinc-500"
            >
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-300">
              <SelectItem
                value="gemini-2.0-flash"
                className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
              >
                <div className="flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-yellow-400" />
                  2.0 Flash
                </div>
              </SelectItem>
              <SelectItem
                value="gemini-2.5-flash-preview-04-17"
                className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
              >
                <div className="flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-orange-400" />
                  2.5 Flash
                </div>
              </SelectItem>
              <SelectItem
                value="gemini-2.5-pro-preview-05-06"
                className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
              >
                <div className="flex items-center">
                  <Cpu className="h-4 w-4 mr-2 text-purple-400" />
                  2.5 Pro
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Original Footer Text */}
      <p className="text-xs text-zinc-600 mt-auto pb-4">
        Powered by Google Gemini and LangChain LangGraph.
      </p>
    </div>
  );
};
