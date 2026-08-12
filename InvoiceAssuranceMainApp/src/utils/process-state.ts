export interface ProcessVariable {
  id: string;
  name: string;
  value: unknown;
}

export function accumulateVariables<T extends ProcessVariable>(previous: T[], incoming: T[]): T[] {
  const byId = new Map(previous.map((variable) => [variable.id, variable]));
  for (const variable of incoming) byId.set(variable.id, variable);
  return [...byId.values()].sort((left, right) => left.name.localeCompare(right.name));
}
