export async function loadUiConfig() {
  const [stagesRes, itemsRes] = await Promise.all([
    fetch(new URL("../config/stages.json", import.meta.url)),
    fetch(new URL("../config/items.json", import.meta.url))
  ]);
  if (!stagesRes.ok) throw new Error(`stages.json(ui) load failed: ${stagesRes.status}`);
  if (!itemsRes.ok) throw new Error(`items.json(ui) load failed: ${itemsRes.status}`);
  return {
    stages: await stagesRes.json(),
    items: await itemsRes.json()
  };
}
