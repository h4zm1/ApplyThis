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
        <button onClick={PreviewAction?.run}>
          {isCompiling ? "Compiling..." : "Preview"}
        </button>
        <button onClick={CompileAndSaveAction?.run}>
          {isCompiling ? "Compiling..." : "Compile and Save"}
        </button>
      </div>
      <div className="latex-editor-wrapper">
        <div ref={containerRef} className="latex-editor"></div>;
      </div>
    </div>
  );
};

export default LateXEditor;
