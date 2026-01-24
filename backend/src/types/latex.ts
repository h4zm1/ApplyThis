// request body when we want to compile
export interface CompileRequest {
  source: string;
  compliter: "pdflatex" | "lualatex";
}

// what we want to return after compiling
export interface CompileResule {
  success: boolean;
  pdf?: Buffer; // node binary data (like byte[] in java)
  errors?: string[];
}
