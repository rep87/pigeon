export async function loadStagesConfig() {
  const res = await fetch(new URL("../config/stages.json", import.meta.url));
  if (!res.ok) throw new Error(`stages.json load failed: ${res.status}`);
  return res.json();
}
