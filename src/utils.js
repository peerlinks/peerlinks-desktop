export function keyToColor(publicKey) {
  const r = parseInt(publicKey.slice(0, 2), 16);
  const g = parseInt(publicKey.slice(2, 4), 16);
  const b = parseInt(publicKey.slice(4, 6), 16);
  return `rgb(${r},${g},${b})`;
}
