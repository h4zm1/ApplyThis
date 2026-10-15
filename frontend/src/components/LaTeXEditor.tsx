import { useEffect, useRef } from "react";
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { latex } from "codemirror-lang-latex";
import {
  bracketMatching,
  defaultHighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { searchKeymap } from "@codemirror/search";
import { useAction } from "../context/AppContext";
import Tooltip from "./ui/tooltip";

interface LaTeXEditorProps {
  value: string; // latex source code
  onChange: (value: string) => void; // callback when contnet change
}

const LateXEditor = ({ value, onChange }: LaTeXEditorProps) => {
  // ref to the container div that codeMirror will attach to
  const containerRef = useRef<HTMLDivElement>(null);

  // ref to store EditorView instance
  const viewRef = useRef<EditorView | null>(null);

  // init effect, setting up editor instance
  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(), // highlight line number
        latex(), // latex language support
        bracketMatching(), // hightlight brackets when near any of the two ends
        history(), // enable undo/redo
        EditorView.lineWrapping,
        // keymaps
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
        syntaxHighlighting(defaultHighlightStyle), // synstax highlighting

        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
      ],
    });

    // initialize the view and inject it into the DOM
    const view = new EditorView({
      state,
      parent: containerRef.current,
    });
    viewRef.current = view;
    // clean up, also prevent double editor from appearing on page load
    return () => {
      view.destroy();
    };
  }, []);

  // sync effect, update editor if value prop changed from outside (in db)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentContent = view.state.doc.toString();

    // prevent infinite loop, prop change => dispatch > update listener > onChange > prop change
    if (value !== currentContent) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: value,
        },
      });
    }
  }, [value]);
  const { PreviewAction, isCompiling, CompileAndSaveAction } = useAction();

  return (
    <div className="editor-content">
      <div className="editor-header">
        <Tooltip label="Run" side="bottom">
          <button onClick={PreviewAction?.run}>
            {/* {isCompiling ? "Compiling..." : "Preview"} */}
            <svg
              viewBox="0 0 36 36"
              className="custom-play-icon"
              width="24"
              height="24"
              fill="currentColor"
            >
              <path d="M32.16,16.08,8.94,4.47A2.07,2.07,0,0,0,6,6.32V29.53a2.06,2.06,0,0,0,3,1.85L32.16,19.77a2.07,2.07,0,0,0,0-3.7Z"></path>
            </svg>
          </button>
        </Tooltip>
        <Tooltip label="Built & View" side="bottom">
          <button onClick={CompileAndSaveAction?.run}>
            {isCompiling ? "Compiling..." : "Compile and Save"}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="50"
              viewBox="0 0 512 512"
            >
              <path d="M87 31h101q24 2 41 21l8 7 3 2 2 2 64 59 2 1 2 3 8 7q21 17 24 42v39h-22l-1-43h-66q-26 2-47-16-14-14-14-34V54H87q-13 0-24 10-8 9-8 21v319l-1 16q-1 18 10 29 11 9 24 8h18l16 1h49v22H82q-21 0-36-16-16-18-15-42V88q0-23 16-41 17-16 40-16m127 38v45q-1 14 8 25 12 11 29 10h50l-3-3-1-2-8-8-2-1-3-3-7-6-4-4-12-11-20-18-2-3-8-7-2-1-4-4-7-6-2-2zm130 179l2 1q47 11 83 44l2 2 11 11 4 5c34 35 34 35 33 54-2 17-20 35-31 48l-3 3a204 204 0 0 1-53 43q-38 22-82 21h-2a152 152 0 0 1-41-5q-49-14-85-50l-3-3q-9-8-16-18l-2-3-14-20-2-2q-6-10-6-21c4-13 14-24 22-34l2-3q46-58 117-74l4-1q30-4 60 2m-137 60l-6 5q-23 21-39 49c18 36 53 67 89 84l4 2c26 11 58 14 86 7l2-1q30-6 53-24l2-1q26-19 45-45l2-3 9-12 1-3v-7l-2-4-2-2-2-2-1-2c-29-40-67-72-117-81-45-6-91 9-124 40m124 5l2 1q20 9 27 29 8 23-3 45-10 20-33 27l-14 1h-3q-22 0-37-16a53 53 0 0 1-14-40q0-22 16-37c16-15 39-18 59-10m-47 30q-7 12-6 26 3 12 12 19 13 8 27 6 13-4 19-15 7-12 4-25-4-12-15-19-23-10-41 8" />
            </svg>

            {/* <svg */}
            {/*   viewBox="0 0 136 136" */}
            {/*   className="custom-play-icon" */}
            {/*   width="136" */}
            {/*   height="136" */}
            {/*   fill="currentColor" */}
            {/* > */}
            {/*   <path d="M17.71,32a2,2,0,0,1-.86-.2A1.77,1.77,0,0,1,16,30v-6.7L5.17,31.58a1.94,1.94,0,0,1-2.06.22A2,2,0,0,1,2,30V6A2,2,0,0,1,3.11,4.2a1.93,1.93,0,0,1,2.06.22L16,12.69V6a1.77,1.77,0,0,1,.85-1.79,1.93,1.93,0,0,1,2.06.22l15.32,12a2,2,0,0,1,0,3.15l-15.32,12A2,2,0,0,1,17.71,32Z"></path> */}
            {/* </svg> */}
          </button>
        </Tooltip>
      </div>
      <div className="latex-editor-wrapper">
        <div ref={containerRef} className="latex-editor"></div>;
      </div>
    </div>
  );
};

export default LateXEditor;
