/**
 * Convert the timestamp string into a discord output of the format:
 * date (time ago)
 * @param timestamp - Timestamp string
 * @returns Output for a discord message
 */
export function timestampToDiscordTimestamp(timestamp?: string): string {
  if (!timestamp) return "Unknown";
  const unixtime = Math.floor(new Date(timestamp).getTime() / 1000);
  return `<t:${unixtime}:D> (<t:${unixtime}:R>)`;
}

/**
 * Convert the Date into a discord output of the format:
 * date (time ago)
 * @param Date - Date object
 * @returns Output for a discord message
 */
export function dateToDiscordTimestamp(date?: Date): string {
  if (!date) return "Unknown";
  const unixtime = Math.floor(date.getTime() / 1000);
  return `<t:${unixtime}:D> (<t:${unixtime}:R>)`;
}

/**
 * Strip the $ and _name; from Elite item names, e.g. $weaponcomponent_name; => weaponcomponent
 * @param name - Raw name
 * @returns Processed name
 */
export function stripVarName(name: string): string {
  if (name.startsWith("$")) return name.slice(1, -6);
  return name;
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
