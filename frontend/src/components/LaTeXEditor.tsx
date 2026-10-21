import { useEffect, useRef } from "react";
import {
  TextSelectMoveDown,
  TextSelectMoveUp,
} from "@material-symbols-svg/react";
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { EditorSelection, EditorState } from "@codemirror/state";
import { latex } from "codemirror-lang-latex";
import {
  bracketMatching,
  defaultHighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import {
  defaultKeymap,
  history,
  historyKeymap,
  moveLineDown,
  moveLineUp,
  toggleLineComment,
} from "@codemirror/commands";
import { openSearchPanel, searchKeymap } from "@codemirror/search";
import { useAction } from "../context/AppContext";
import Tooltip from "./ui/tooltip";
import {
  Bold,
  FileSearchCorner,
  Italic,
  LucideSaveOff,
  Percent,
  Save,
  SaveCheckIcon,
  SaveOff,
  SavePen,
  SavePenIcon,
  Search,
  Underline,
} from "lucide-react";

interface LaTeXEditorProps {
  value: string; // latex source code
  onChange: (value: string) => void; // callback when contnet change
}

const FORMATS = {
  bold: { before: "\\textbf{", after: "}" },
  italic: { before: "\\textit{", after: "}" },
  underline: { before: "\\underline{", after: "}" },
};

type Format = { before: string; after: string };

// wrap selected text in the giving format (or remove it if it's already there)
function toggleWrap(view: EditorView, format: Format) {
  const { before, after } = format;

  // changeByrange loop through every selection (for multi cursors)
  // and give us "range" which contain the start and the end of each selection
  const spec = view.state.changeByRange((range) => {
    // this give us the entire text doc (combining it with "range" we can extract the selected text)
    const doc = view.state.doc;

    // this will get the text before the selection (to compare it to format "before")
    const textBefore = doc.sliceString(
      Math.max(0, range.from - before.length),
      range.from,
    );
    const textAfter = doc.sliceString(
      range.to,
      Math.min(doc.length, range.to + after.length),
    );
    // if the grabbed text actually match the format "before" and "after" then the selection is already wrapped
    const alreadyWrapped = textBefore === before && textAfter === after;

    if (alreadyWrapped) {
      // remove the wrapper and keep text selected
      return {
        // delete tag
        changes: [
          { from: range.from - before.length, to: range.from },
          { from: range.to, to: range.to + after.length },
        ],
        // restore selection to how it was before the toggle
        range: EditorSelection.range(
          range.from - before.length,
          range.to - before.length,
        ),
      };
    }

    if (range.empty) {
      // if nothing selected => insert the tag and put the cursor inside it
      return {
        changes: { from: range.from, insert: before + after },
        range: EditorSelection.cursor(range.from + before.length),
      };
    }

    // text selected and no tag wrapping it => wrapp it and keep text selected
    return {
      changes: [
        { from: range.from, insert: before },
        { from: range.to, insert: after },
      ],
      range: EditorSelection.range(
        range.from + before.length,
        range.to + before.length,
      ),
    };
  });

  // apply all changes to editor state and keep the cursor visible in scree)
  view.dispatch(spec, { scrollIntoView: true, userEvent: "input" });
}

// turns a format into a keyboard command
function formatCommand(format: Format) {
  return (view: EditorView) => {
    toggleWrap(view, format);
    return true; // tells CodeMirror the key was handled
  };
}

const LateXEditor = ({ value, onChange }: LaTeXEditorProps) => {
  // ref to the container div that codeMirror will attach to
  const containerRef = useRef<HTMLDivElement>(null);

  // ref to store EditorView instance
  const viewRef = useRef<EditorView | null>(null);

  const {
    PreviewAction,
    isCompiling,
    CompileAndSaveAction,
    saveStatus,
    syncStatus,
  } = useAction();

  // hold newest OnChange, so the listener won't call an old one
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

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
        EditorState.languageData.of(() => [{ commentTokens: { line: "%" } }]),
        // keymaps
        keymap.of([
          {
            key: "Mod-b",
            run: formatCommand(FORMATS.bold),
            preventDefault: true,
          },
          {
            key: "Mod-/",
            run: toggleLineComment,
            preventDefault: true,
          },
          {
            key: "Mod-u",
            run: formatCommand(FORMATS.underline),
            preventDefault: true,
          },
        ]),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
        syntaxHighlighting(defaultHighlightStyle), // synstax highlighting

        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
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

  function applyFormat(format: Format) {
    const view = viewRef.current;
    if (!view) return;
    toggleWrap(view, format);
    view.focus(); // give the keyboard back to the editor
  }
  function applyCommand(command: (view: EditorView) => boolean) {
    const view = viewRef.current;
    if (!view) return;
    command(view);
    view.focus();
  }
  return (
    <div className="editor-content">
      <div className="editor-header">
        <div className="save-icon">
          {saveStatus === "saved" ? (
            <SaveCheckIcon size={24} />
          ) : saveStatus === "error" ? (
            <SaveOff size={24} />
          ) : (
            <SavePenIcon />
          )}
        </div>

        <div className="editor-tools">
          <Tooltip label="Toggle italic text" side="bottom">
            <button
              onClick={(e) => {
                e.currentTarget.classList.add("is-triggered");
                applyFormat(FORMATS.italic);
              }}
              className="btn1"
            >
              <Italic size={16} strokeWidth={2} />
            </button>
          </Tooltip>

          <Tooltip label="Toggle underlined text" side="bottom">
            <button
              onClick={(e) => {
                e.currentTarget.classList.add("is-triggered");
                applyFormat(FORMATS.underline);
              }}
              className="btn2"
            >
              <Underline size={16} strokeWidth={2} />
            </button>
          </Tooltip>

          <Tooltip label="Toggle strong /bold text" side="bottom">
            <button
              onClick={(e) => {
                e.currentTarget.classList.add("is-triggered");
                applyFormat(FORMATS.bold);
              }}
              className="btn3"
            >
              <Bold strokeWidth={3} size={16} />
            </button>
          </Tooltip>
        </div>
        <div className="editor-tools">
          <Tooltip label="Move line up" side="bottom">
            <button
              onClick={(e) => {
                e.currentTarget.classList.add("is-triggered");
                applyCommand(moveLineUp);
              }}
              className="btn1"
            >
              <TextSelectMoveUp size={19} />
            </button>
          </Tooltip>

          <Tooltip label="Move line down" side="bottom">
            <button
              onClick={(e) => {
                e.currentTarget.classList.add("is-triggered");
                applyCommand(moveLineDown);
              }}
              className="btn3"
              style={{ borderLeft: "unset !important" }}
            >
              <TextSelectMoveDown size={19} />
            </button>
          </Tooltip>
        </div>
        <div className="editor-tools">
          <Tooltip label="Find text" side="bottom">
            <button
              onClick={(e) => {
                e.currentTarget.classList.add("is-triggered");
                applyCommand(openSearchPanel);
              }}
              className="btn4"
            >
              <Search size={16} strokeWidth={2} />
            </button>
          </Tooltip>
        </div>
        <div className="editor-tools">
          <Tooltip label="Toggle comment" side="bottom">
            <button
              onClick={(e) => {
                e.currentTarget.classList.add("is-triggered");
                applyCommand(toggleLineComment);
              }}
              className="btn4"
            >
              <Percent size={16} strokeWidth={2} />
            </button>
          </Tooltip>
        </div>

        <div className="run-group">
          {/* <span>isComing: {isCompiling}</span> */}
          {/* <span>sync status: {syncStatus}</span> */}
          <Tooltip label="Build" side="bottom">
            <button
              onClick={(e) => {
                e.currentTarget.classList.add("is-triggered");
                PreviewAction?.run();
              }}
              disabled={isCompiling}
            >
              <svg
                viewBox="0 0 36 36"
                className="custom-play-icon"
                width="24"
                height="24"
                fill="currentColor"
              >
                <path d="M17.71,32a2,2,0,0,1-.86-.2A1.77,1.77,0,0,1,16,30v-6.7L5.17,31.58a1.94,1.94,0,0,1-2.06.22A2,2,0,0,1,2,30V6A2,2,0,0,1,3.11,4.2a1.93,1.93,0,0,1,2.06.22L16,12.69V6a1.77,1.77,0,0,1,.85-1.79,1.93,1.93,0,0,1,2.06.22l15.32,12a2,2,0,0,1,0,3.15l-15.32,12A2,2,0,0,1,17.71,32Z"></path>
              </svg>
            </button>
          </Tooltip>
          <Tooltip label="Build & Sync" side="bottom">
            <button
              onClick={(e) => {
                e.currentTarget.classList.add("is-triggered");
                CompileAndSaveAction?.run();
              }}
              disabled={isCompiling}
            >
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
        </div>
      </div>
      <div className="latex-editor-wrapper">
        <div ref={containerRef} className="latex-editor"></div>
      </div>
    </div>
  );
};

export default LateXEditor;
