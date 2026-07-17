export function assertCommentReference(value, label = "comment reference") {
  if (typeof value === "string" && /^comment:\S+$/.test(value)) return value;
  if (typeof value === "string" && /^https?:\/\/\S+$/.test(value) && URL.canParse(value) && new URL(value).hostname) return value;
  throw new TypeError(`${label} must be comment:<id> or an http(s) URL`);
}
