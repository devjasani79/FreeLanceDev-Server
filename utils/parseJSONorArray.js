function parseJSONorArray(data) {
  if (!data) return [];
  try {
    return typeof data === "string" ? JSON.parse(data) : data;
  } catch (err) {
    return [];
  }
}
