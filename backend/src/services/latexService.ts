import { CompileResule } from "../types/latex";

const LATEX_API = "http://latex.ytotech.com/builds/sync";
const TIMEOUT_MS = 30000; // 30 secs

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
      return {
        success: false,
        errors: [JSON.stringify(errorText)],
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
