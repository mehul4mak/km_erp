import { Fragment } from "react";

const STAGES = [
  ["planned", "Planned"],
  ["started", "Started"],
  ["in_progress", "In Progress"],
  ["finished", "Finished"],
  ["done", "Done"],
];

// Visual lifecycle for a manufacturing order.
export default function StageStepper({ stage }) {
  const idx = STAGES.findIndex(([k]) => k === stage);
  return (
    <div className="stepper">
      {STAGES.map(([k, label], i) => (
        <Fragment key={k}>
          <span className={"step " + (i < idx ? "done" : i === idx ? "now" : "")}>
            <span className="dot">{i < idx ? "✓" : i + 1}</span>
            {label}
          </span>
          {i < STAGES.length - 1 && <span className={"conn " + (i < idx ? "done" : "")} />}
        </Fragment>
      ))}
    </div>
  );
}
