export default function createContainer() {
  const factories = new Map();
  const instances = new Map();

  return {
    register(name, factory) {
      factories.set(name, factory);
    },

    resolve(name) {
      if (!instances.has(name)) {
        const factory = factories.get(name);
        if (!factory) {
          throw new Error(`Service "${name}" not registered`);
        }
        instances.set(name, factory(this));
      }
      return instances.get(name);
    },
  };
}
