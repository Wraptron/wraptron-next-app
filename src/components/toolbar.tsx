"use client";

import {
  FilePlus,
  Plus,
  Undo,
  Redo,
  Database,
  Code,
  Share,
  Smartphone,
  Monitor,
  ZoomIn,
  ZoomOut,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Toolbar = () => {
  // const [url, setUrl] = useState("https://wrap.com");

  const handleAction = (action: string) => {
    console.log(`${action} clicked`);
  };

  return (
    <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-2 shadow-sm">
      {/* Left section - File operations */}
      <div className="flex items-center space-x-2">
        {/* New Section Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1"
            >
              <Plus size={16} />
              {/* <ChevronDown size={12} /> */}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleAction("new-text-section")}>
              <Plus size={14} className="mr-2" />
              Text Section
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("new-image-section")}>
              <Plus size={14} className="mr-2" />
              Image Section
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("new-video-section")}>
              <Plus size={14} className="mr-2" />
              Video Section
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* New Page Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1"
            >
              <FilePlus size={16} />
              <ChevronDown size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleAction("new-blank-page")}>
              <FilePlus size={14} className="mr-2" />
              Blank Page
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("new-template-page")}>
              <FilePlus size={14} className="mr-2" />
              From Template
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="h-6 w-px bg-gray-300 mx-2" /> {/* Separator */}
        {/* Undo/Redo */}
        <Button variant="ghost" size="sm" onClick={() => handleAction("undo")}>
          <Undo size={16} />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleAction("redo")}>
          <Redo size={16} />
        </Button>
      </div>

      {/* Center section - URL Bar */}
      <div className="flex-1 max-w-2xl mx-6">
        <div className="relative">
          <input
            type="text"
            // onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAction("navigate-url");
              }
            }}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            placeholder="Enter URL or search..."
          />
        </div>
      </div>
      {/* Zoom Controls */}
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAction("zoom-out")}
          className="px-2 py-1 h-7"
        >
          <ZoomOut size={14} />
        </Button>
        <span className="text-sm text-gray-600 min-w-[3rem] text-center">
          100%
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAction("zoom-in")}
          className="px-2 py-1 h-7"
        >
          <ZoomIn size={14} />
        </Button>
      </div>
      {/* Device Preview */}
      <div className="flex items-center bg-gray-100 rounded-md p-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAction("mobile-view")}
          className="px-2 py-1 h-7"
        >
          <Smartphone size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAction("web-view")}
          className="px-2 py-1 h-7"
        >
          <Monitor size={14} />
        </Button>
      </div>

      {/* Tools section - moved to separate area */}
      <div className="flex items-center space-x-1">
        {/* Database */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1"
            >
              <Database size={16} />
              <ChevronDown size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleAction("connect-database")}>
              <Database size={14} className="mr-2" />
              Connect Database
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("create-table")}>
              <Database size={14} className="mr-2" />
              Create Table
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("import-data")}>
              <Database size={14} className="mr-2" />
              Import Data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Code */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1"
            >
              <Code size={16} />
              <ChevronDown size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleAction("html-css")}>
              <Code size={14} className="mr-2" />
              HTML/CSS
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("javascript")}>
              <Code size={14} className="mr-2" />
              JavaScript
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("custom-code")}>
              <Code size={14} className="mr-2" />
              Custom Code
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Share */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1"
            >
              <Share size={16} />
              <ChevronDown size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleAction("share-link")}>
              <Share size={14} className="mr-2" />
              Copy Link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("share-email")}>
              <Share size={14} className="mr-2" />
              Share via Email
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("embed-code")}>
              <Share size={14} className="mr-2" />
              Get Embed Code
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right section - View controls */}
      <div className="flex items-center space-x-2">
        <div className="h-6 w-px bg-gray-300 mx-2" /> {/* Separator */}
      </div>
    </div>
  );
};

export default Toolbar;
