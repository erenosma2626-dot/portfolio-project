/**
 * three'nin konsol kancasında susturulacak, bilinen ve bizim düzeltemeyeceğimiz
 * uyarılar. R3F 9.8 store'u `new THREE.Clock()` oluşturuyor; three r183+ bunu
 * deprecated diye uyarıyor. R3F güncellenince bu liste boşaltılmalı.
 */
const KNOWN = ["THREE.Clock: This module has been deprecated"];

export function isKnownThirdPartyWarning(type: string, message: string): boolean {
  return type === "warn" && KNOWN.some((k) => message.startsWith(k));
}
