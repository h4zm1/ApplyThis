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
        {/* <Tooltip label="Built & View" side="bottom"> */}
        {/*   <button onClick={CompileAndSaveAction?.run}> */}
        {/* {isCompiling ? "Compiling..." : "Compile and Save"} */}
        {/*     <svg */}
        {/*       viewBox="0 0 36 36" */}
        {/*       className="custom-play-icon" */}
        {/*       width="18" */}
        {/*       height="18" */}
        {/*       fill="currentColor" */}
        {/*     > */}
        {/*       <path d="M17.71,32a2,2,0,0,1-.86-.2A1.77,1.77,0,0,1,16,30v-6.7L5.17,31.58a1.94,1.94,0,0,1-2.06.22A2,2,0,0,1,2,30V6A2,2,0,0,1,3.11,4.2a1.93,1.93,0,0,1,2.06.22L16,12.69V6a1.77,1.77,0,0,1,.85-1.79,1.93,1.93,0,0,1,2.06.22l15.32,12a2,2,0,0,1,0,3.15l-15.32,12A2,2,0,0,1,17.71,32Z"></path> */}
        {/*     </svg> */}
        {/*   </button> */}
        {/* </Tooltip> */}
      </div>
      <div className="latex-editor-wrapper">
        <div ref={containerRef} className="latex-editor"></div>;
      </div>
    </div>
  );
};

export default LateXEditor;
