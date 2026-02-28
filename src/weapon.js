export async function loadWeaponsConfig() {
  const res = await fetch(new URL("../config/weapons.json", import.meta.url));
  if (!res.ok) throw new Error(`weapons.json load failed: ${res.status}`);
  return res.json();
}
