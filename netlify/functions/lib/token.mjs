// Shared by api.mjs and pin.mjs: the staff token is an HMAC of a fixed label keyed with the PIN,
// so changing STAFF_PIN signs every phone out.
const enc = new TextEncoder();
export async function staffTokenFor(pin) {
  const key = await crypto.subtle.importKey("raw", enc.encode(String(pin)), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("lounge-staff-v1"));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
