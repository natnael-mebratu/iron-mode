import { equipmentName } from "../data/equipment";
import type { Availability } from "../lib/types";

interface Props {
  equipmentId: string;
  prompt: string;
  onAnswer: (id: string, value: Availability) => void;
}

/** One short yes/no question about a piece of equipment we don't know about yet. */
export function AskEquipment({ equipmentId, prompt, onAnswer }: Props) {
  return (
    <div className="ask">
      <p>
        {prompt} <strong>Does your gym have: {equipmentName(equipmentId)}?</strong>
      </p>
      <div className="ask__buttons">
        <button type="button" className="btn btn--small" onClick={() => onAnswer(equipmentId, "available")}>
          Yes
        </button>
        <button
          type="button"
          className="btn btn--small btn--ghost"
          onClick={() => onAnswer(equipmentId, "unavailable")}
        >
          No
        </button>
      </div>
    </div>
  );
}
