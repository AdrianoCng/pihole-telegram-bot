import createContainer from "../../container.js";

describe("Container", () => {
  let container;

  beforeEach(() => {
    container = createContainer();
  });

  it("registers and resolves a service", () => {
    container.register("foo", () => "bar");
    expect(container.resolve("foo")).toBe("bar");
  });

  it("caches resolved services (singleton)", () => {
    let callCount = 0;
    container.register("counter", () => ++callCount);

    container.resolve("counter");
    container.resolve("counter");

    expect(callCount).toBe(1);
  });

  it("passes itself to the factory for resolving dependencies", () => {
    container.register("a", () => 1);
    container.register("b", (c) => c.resolve("a") + 1);

    expect(container.resolve("b")).toBe(2);
  });

  it("throws for unregistered services", () => {
    expect(() => container.resolve("missing")).toThrow(
      'Service "missing" not registered'
    );
  });
});
