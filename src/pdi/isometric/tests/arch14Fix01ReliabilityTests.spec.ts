import { describe, it, expect } from "vitest";
import { generateDxfFile } from "../serialization/dxfSerialization";
import { makeNode, makeFitting } from "../core/IsoTopologyGraph";
import { type IsoSegment } from "../types/isoGraphTypes";

describe("ARCH-14-FIX-01 — Import/Export Reliability Tests", () => {
  it("verifies basic DXF serialization entities and structure", () => {
    const n1 = makeNode("Start", 0, 0, 0);
    const n2 = makeNode("End", 10, 0, 0);
    const seg: IsoSegment = {
      id: "S1",
      fromNodeId: n1.id,
      toNodeId: n2.id,
      length: 10,
      dn: 150,
      pn: "PN40",
      schedule: "STD",
      material: "API 5L Gr.B",
      type: "straight",
      fittings: [makeFitting("coude_90", 0.5, 150)],
      lineId: "line_default",
    };
    const dxf = generateDxfFile([n1, n2], [seg]);
    expect(dxf).toContain("SECTION");
    expect(dxf).toContain("PIPING_LINES");
    expect(dxf).toContain("PIPING_FITTINGS");
  });
});
