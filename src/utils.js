export function keyToColor (publicKey) {
  let r = parseInt(publicKey.slice(0, 2), 16);
  let g = parseInt(publicKey.slice(2, 4), 16);
  let b = parseInt(publicKey.slice(4, 6), 16);

  const scale = 255 / (Math.sqrt(r ** 2 + g ** 2 + b ** 2) + 1e-23);
  r *= scale;
  g *= scale;
  b *= scale;

  return `rgb(${r},${g},${b})`;
}

export function prerenderUserName ({ name, publicKey, isInternal = false }) {
  if (!isInternal) {
    name = name.trim().replace(/^[#@]+/, '');
  }

  return {
    name,
    color: keyToColor(publicKey),
  };
}

export function getFeedURL (feed) {
  return `peerlinks://feed/${feed.publicKeyB58}?` +
    `name=${encodeURIComponent(feed.name)}`;
}
