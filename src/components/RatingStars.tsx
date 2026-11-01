interface Props {
  value: number;
  onChange: (value: number) => void;
  label: string;
}

/** Five tappable stars. Tapping the current rating again clears it. */
export function RatingStars({ value, onChange, label }: Props) {
  return (
    <div className="stars" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          className={`star${n <= value ? " star--on" : ""}`}
          onClick={() => onChange(value === n ? 0 : n)}
        >
          {n <= value ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}
