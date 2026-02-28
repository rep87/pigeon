export async function loadItemsConfig() {
  const res = await fetch(new URL("../config/items.json", import.meta.url));
  if (!res.ok) throw new Error(`items.json load failed: ${res.status}`);
  return res.json();
}
