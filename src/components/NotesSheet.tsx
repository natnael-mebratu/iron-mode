import { useState } from "react";
import { Sheet } from "./Sheet";

interface Props {
  name: string;
  note: string;
  onSave: (note: string) => void;
  onClose: () => void;
}

/** Remember how you set up a machine, e.g. "seat 4, back pad 3". */
export function NotesSheet({ name, note, onSave, onClose }: Props) {
  const [text, setText] = useState(note);
  return (
    <Sheet title="Machine notes" subtitle={name} onClose={onClose}>
      <label className="field">
        <span className="muted small">Seat height, pad position, grip, anything you'll want next time</span>
        <textarea
          className="textinput textarea"
          rows={3}
          maxLength={200}
          placeholder="e.g. seat 4, back pad 3, narrow grip"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />
      </label>
      <div className="btnrow">
        <button type="button" className="btn btn--small" onClick={() => (onSave(text.trim()), onClose())}>
          Save
        </button>
        {note && (
          <button type="button" className="linkbtn" onClick={() => (onSave(""), onClose())}>
            Remove note
          </button>
        )}
      </div>
    </Sheet>
  );
}
