"use client";

import {
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type BuiltInEdge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/base.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type FlowStage = {
  id: string;
  name: string;
  owner: string;
  /** The most severe leak at this stage, if any. */
  leak?: "high" | "medium" | "low";
  leakCount: number;
};

export type FlowLink = {
  from: string;
  to: string;
  label?: string;
};

type StageData = FlowStage & { n: number; vertical: boolean };

const NODE_W = 184;
const NODE_H = 92;
const GAP_X = 52;
const GAP_Y = 64;

function StageNode({ data }: NodeProps<Node<StageData>>) {
  const leak = data.leak;
  return (
    <div
      className={cn(
        "relative flex h-[92px] w-[184px] cursor-pointer flex-col justify-between rounded-xl border bg-surface px-3 py-2.5 text-left shadow-[var(--shadow-card)] transition-colors hover:border-line-strong",
        leak === "high" ? "border-live" : leak ? "border-ink-3/50" : "border-line",
      )}
    >
      <Handle id="main-in" type="target" position={data.vertical ? Position.Top : Position.Left} className="!size-1.5 !border-0 !bg-line-strong" />
      <Handle id="loop-in" type="target" position={data.vertical ? Position.Left : Position.Bottom} className="!size-1 !border-0 !bg-transparent" />
      <div>
        <div className="u-num text-[10px] text-ink-3">{String(data.n).padStart(2, "0")}</div>
        <div className="mt-0.5 line-clamp-2 text-[13px] leading-[1.25] font-medium text-ink">{data.name}</div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] text-ink-3">{data.owner}</span>
        {leak && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-[4px] px-1.5 py-px font-mono text-[9px] tracking-[0.08em] uppercase",
              leak === "high" ? "bg-live text-live-contrast" : "border border-ink-3/50 text-ink-2",
            )}
          >
            Leak{data.leakCount > 1 ? ` ×${data.leakCount}` : ""}
          </span>
        )}
      </div>
      <Handle id="main-out" type="source" position={data.vertical ? Position.Bottom : Position.Right} className="!size-1.5 !border-0 !bg-line-strong" />
      <Handle id="loop-out" type="source" position={data.vertical ? Position.Left : Position.Bottom} className="!size-1 !border-0 !bg-transparent" />
    </div>
  );
}

const nodeTypes = { stage: StageNode };

function layout(stages: FlowStage[], links: FlowLink[], vertical: boolean) {
  const perRow = vertical ? 1 : stages.length > 6 ? Math.ceil(stages.length / 2) : stages.length;
  const leakAt = new Map(stages.map((s) => [s.id, s.leak]));
  const nodes: Node<StageData>[] = stages.map((s, i) => {
    const row = vertical ? i : Math.floor(i / perRow);
    const col = vertical ? 0 : i % perRow;
    return {
      id: s.id,
      type: "stage",
      position: { x: col * (NODE_W + GAP_X), y: row * (NODE_H + GAP_Y) },
      data: { ...s, n: i + 1, vertical },
      draggable: false,
      connectable: false,
    };
  });
  const edgeStyle = (to: string) =>
    leakAt.get(to) === "high"
      ? { stroke: "var(--live)", strokeWidth: 1.75 }
      : { stroke: "var(--ink-3)", strokeWidth: 1.25 };
  const edges: BuiltInEdge[] = stages.slice(1).map((s, i) => ({
    id: `e-${stages[i].id}-${s.id}`,
    source: stages[i].id,
    target: s.id,
    sourceHandle: "main-out",
    targetHandle: "main-in",
    type: "smoothstep",
    animated: leakAt.get(s.id) === "high",
    style: edgeStyle(s.id),
    markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: leakAt.get(s.id) === "high" ? "var(--live)" : "var(--ink-3)" },
  }));
  for (const l of links) {
    edges.push({
      id: `l-${l.from}-${l.to}`,
      source: l.from,
      target: l.to,
      sourceHandle: "loop-out",
      targetHandle: "loop-in",
      type: "smoothstep",
      pathOptions: { offset: 22, borderRadius: 10 },
      label: l.label,
      labelStyle: { fill: "var(--ink-2)", fontSize: 11 },
      labelBgStyle: { fill: "var(--page)" },
      labelBgPadding: [4, 2],
      style: { stroke: "var(--ink-3)", strokeWidth: 1.25, strokeDasharray: "4 4" },
      markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: "var(--ink-3)" },
    });
  }
  const rows = vertical ? stages.length : Math.ceil(stages.length / perRow);
  return { nodes, edges, height: rows * NODE_H + (rows - 1) * GAP_Y };
}

function Flow({ stages, links }: { stages: FlowStage[]; links: FlowLink[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [vertical, setVertical] = useState(false);
  const { fitView } = useReactFlow();

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setVertical(e.contentRect.width < 640));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { nodes, edges, height } = useMemo(() => layout(stages, links, vertical), [stages, links, vertical]);

  useEffect(() => {
    const id = requestAnimationFrame(() => fitView({ padding: 0.12, duration: 0 }));
    return () => cancelAnimationFrame(id);
  }, [vertical, fitView]);

  // Room underneath (or beside, when vertical) for loop-back edges.
  const canvasH = vertical ? height + 80 : Math.max(240, height + (links.length ? 130 : 96));

  return (
    <div ref={wrap} className="workflow-flow u-dots relative w-full overflow-hidden rounded-[var(--radius)] border border-line bg-inset/60" style={{ height: canvasH }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        minZoom={0.4}
        maxZoom={1.6}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        panOnScroll={false}
        preventScrolling={false}
        panOnDrag={!vertical}
        zoomOnDoubleClick={false}
        onNodeClick={(_, n) => {
          window.location.hash = `stage-${n.id}`;
        }}
        proOptions={{ hideAttribution: false }}
      />
    </div>
  );
}

/** A workflow as a flowchart. The stage table under it carries every word, so this is the picture, not the only record. */
export default function WorkflowFlow(props: { stages: FlowStage[]; links: FlowLink[] }) {
  return (
    <ReactFlowProvider>
      <Flow {...props} />
    </ReactFlowProvider>
  );
}
