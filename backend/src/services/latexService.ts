import { pdfToPng } from "pdf-to-png-converter";
import { CompileResule } from "../types/latex";
import logger from "../config/logger";

const LATEX_API = process.env.LATEX_API!;
const TIMEOUT_MS = 30000; // 30 secs

const MAX_ERRORS = 10;

// get a readable error from the latex compiler response
function extractLatexErrors(errorText: string): string[] {
  try {
    const data = JSON.parse(errorText);
    const log: string = data.log_files?.["__main_document__.log"] ?? "";

    // error lines look like: ./__main_document__.tex:12: LaTeX Error: ...
    const errorLines = log.split("\n").filter((line) => line.includes(".tex:"));

    // turn "./__main_document__.tex:12:" into "Line 12:"
    const readable = errorLines.map((line) =>
      line.replace("./__main_document__.tex:", "Line "),
    );

    // remove duplicates, and keep only the first few
    const unique = [...new Set(readable)];
    return unique.slice(0, 5);
  } catch {
    // the response wasn't json
    return [];
  }
}
export async function compilationLatex(source: string): Promise<CompileResule> {
  // create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // call latex api
    const response = await fetch(LATEX_API, {
      // stop and wait for response headed
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        compiler: "pdflatex",
        resources: [
          {
            main: true,
            content: source,
          },
        ],
      }),
      signal: controller.signal, // attach abort signal to fetch, and keep it in an event loop
    });

    // checking for contenttype in header didn't work
    // so now will always read as arraybuffer first
    const arrayBuffer = await response.arrayBuffer(); // stop and wait for full body to download
    const buffer = Buffer.from(arrayBuffer);

    // and check if first 5 bytes are '%PDF-' which should guarante it's a pdf
    // if not then it means it's an error, convert it to string and return
    const isPdf = buffer.length > 5 && buffer.toString("utf8", 0, 5) == "%PDF-";

    if (isPdf) {
      return {
        success: true,
        pdf: buffer,
      };
    } else {
      // not a pdf, must be an error
      // convert buffer to string and parse
      const errorText = buffer.toString("utf8");
      const errors = extractLatexErrors(errorText);

      if (errors.length === 0) {
        // can't read it, just log it
        logger.warn(
          { status: response.status, body: errorText.slice(0, 500) },
          "latex compile failed without readable errors",
        );
        return {
          success: false,
          errors: ["compilation failed, please check your LaTeX"],
        };
      }
      return {
        success: false,
        errors,
      };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: false,
        errors: ["compilation timed out - please try again"],
      };
    }
    // network error or something went wrong
    return {
      success: false,
      errors: [error instanceof Error ? error.message : "unkown error"],
    };
  } finally {
    // always clear timeout, in success or failure
    clearTimeout(timeoutId);
  }
}
