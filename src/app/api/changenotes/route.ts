import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import packageJson from "../../../../package.json";
import { parseChangenotesMarkdown } from "@/lib/changenotes";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawLimit = searchParams.get("limit");
  const limit = Math.min(
    20,
    Math.max(1, rawLimit ? parseInt(rawLimit, 10) || 3 : 3),
  );

  try {
    const filePath = path.join(process.cwd(), "src/data/changenotes.md");
    const md = await readFile(filePath, "utf8");
    const all = parseChangenotesMarkdown(md);
    return NextResponse.json({
      appVersion: packageJson.version,
      entries: all.slice(0, limit),
    });
  } catch {
    return NextResponse.json({
      appVersion: packageJson.version,
      entries: [] as { heading: string; items: string[] }[],
    });
  }
}
