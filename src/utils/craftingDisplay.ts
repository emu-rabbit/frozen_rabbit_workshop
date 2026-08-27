// Company crafting (0) and Island Sanctuary (-10) have no crafting job level.
export function hasCraftingLevel(job: number | undefined): boolean {
  return job !== undefined && job > 0;
}
