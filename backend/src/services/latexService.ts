import { error } from "node:console";
import { CompileResule } from "../types/latex";

const LATEX_API = "http://latex.ytotech.com/builds/sync";

export async function compilationLatex(source: string): Promise<CompileResule> {
  try {
    // call latex api
    const response = await fetch(LATEX_API, {
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
    });

    // checking for contenttype in header didn't work
    // so now will always read as arraybuffer first
    const arrayBuffer = await response.arrayBuffer();
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
    // network error or something went wrong
    return {
      success: false,
      errors: [error instanceof Error ? error.message : "unkown error"],
    };
  }
}
