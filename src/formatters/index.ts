export { formatJSON } from "./json";
export { formatCSV } from "./csv";
export { formatPretty } from "./pretty";

export type OutputFormat = "json" | "csv" | "pretty";
export const OUTPUT_FORMATS: OutputFormat[] = ["json", "csv", "pretty"];
