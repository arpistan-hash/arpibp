// Returns the guest book messages (name, message, date only) from Netlify Forms.
// Needs one environment variable in Netlify: NETLIFY_AUTH_TOKEN (a personal access token).
// The email address is never returned.
exports.handler = async function () {
  const headers = { "content-type": "application/json", "cache-control": "public, max-age=30" };
  const token = process.env.NETLIFY_AUTH_TOKEN;
  const site = process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
  if (!token || !site) return { statusCode: 200, headers, body: JSON.stringify({ entries: [], configured: false }) };
  try {
    const api = "https://api.netlify.com/api/v1";
    const auth = { authorization: "Bearer " + token };
    const forms = await (await fetch(api + "/sites/" + site + "/forms", { headers: auth })).json();
    const form = Array.isArray(forms) && forms.find((f) => f.name === "guestbook");
    if (!form) return { statusCode: 200, headers, body: JSON.stringify({ entries: [], configured: true }) };
    const subs = await (await fetch(api + "/forms/" + form.id + "/submissions?per_page=100", { headers: auth })).json();
    const entries = (Array.isArray(subs) ? subs : [])
      .map((s) => ({
        name: String((s.data && s.data.name) || "").trim().slice(0, 60),
        msg: String((s.data && s.data.msg) || "").trim().slice(0, 600),
        ts: Date.parse(s.created_at) || 0,
      }))
      .filter((e) => e.name && e.msg)
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 100);
    return { statusCode: 200, headers, body: JSON.stringify({ entries, configured: true }) };
  } catch (e) {
    return { statusCode: 200, headers, body: JSON.stringify({ entries: [], configured: true, error: true }) };
  }
};
