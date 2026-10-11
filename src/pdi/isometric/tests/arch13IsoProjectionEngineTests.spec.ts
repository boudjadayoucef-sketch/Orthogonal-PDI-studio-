import { describe, it, expect } from "vitest";
import {
  isoProjectV4,
  isoUnprojectV4,
  getProjectionAxes,
  PDI_ISO_COS_017I2,
  PDI_ISO_SIN_017I2,
} from "../core/isoProjectionEngine";

describe("ARCH-13 — Safe Isometric Projection Engine Extraction", () => {
  it("computes projection axes correctly across view modes", () => {
    const isoAxes = getProjectionAxes("iso");
    expect(isoAxes.dx_x).toBeCloseTo(PDI_ISO_COS_017I2, 5);
    expect(isoAxes.dy_z).toBe(-1);

    const topAxes = getProjectionAxes("top");
    expect(topAxes.dx_x).toBe(1);
    expect(topAxes.dy_y).toBe(1);

    const frontAxes = getProjectionAxes("front");
    expect(frontAxes.dx_x).toBe(1);
    expect(frontAxes.dy_z).toBe(-1);

    const sideAxes = getProjectionAxes("side");
    expect(sideAxes.dx_y).toBe(1);
    expect(sideAxes.dy_z).toBe(-1);
  });

  it("projects and unprojects world points deterministically in iso mode", () => {
    const p3d = { x: 10, y: 5, z: 2 };
    const screen = isoProjectV4(p3d.x, p3d.y, p3d.z, 1, 0, 0, "iso");
    expect(typeof screen.x).toBe("number");
    expect(typeof screen.y).toBe("number");

    const unprojected = isoUnprojectV4(screen.x, screen.y, 1, 0, 0, p3d.z, "iso");
    expect(unprojected.x).toBeCloseTo(p3d.x, 2);
    expect(unprojected.y).toBeCloseTo(p3d.y, 2);
    expect(unprojected.z).toBe(p3d.z);
  });

  it("handles zoom and pan scaling correctly", () => {
    const p1 = isoProjectV4(0, 0, 0, 1, 0, 0, "iso");
    const p2 = isoProjectV4(0, 0, 0, 2, 0, 0, "iso");
    expect(p1.x).toBe(310);
    expect(p1.y).toBe(210);
    expect(p2.x).toBe(310);

    const pPan = isoProjectV4(0, 0, 0, 1, 50, 100, "iso");
    expect(pPan.x).toBe(360);
    expect(pPan.y).toBe(310);
  });
});
