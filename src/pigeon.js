export async function loadAnimalsConfig() {
  const res = await fetch(new URL("../config/animals.json", import.meta.url));
  if (!res.ok) throw new Error(`animals.json load failed: ${res.status}`);
  return res.json();
}
