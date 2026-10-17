import { it, expect, vi } from "vitest";
import { spawnPiholeCommand } from "../../../pihole/cli.js";
import { pause } from "../service.js";

vi.mock("../../../pihole/cli.js");

it("pauses blocking with a timed Pi-hole disable", async () => {
  const onOutput = vi.fn();

  await pause(300, onOutput);

  expect(spawnPiholeCommand).toHaveBeenCalledWith(["disable", "300s"], onOutput);
});
