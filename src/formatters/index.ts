export { formatJSON } from "./json.js";
export { formatCSV } from "./csv.js";
export { formatPretty } from "./pretty.js";

export type OutputFormat = "json" | "csv" | "pretty";
export const OUTPUT_FORMATS: OutputFormat[] = ["json", "csv", "pretty"];
