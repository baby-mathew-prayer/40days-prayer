type Signup = {
  id: string;
  prayer_date: string;
  display_name: string;
  created_at: string;
};

function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let part = "";
  let bytes = 0;
  for (const character of line) {
    const length = encoder.encode(character).length;
    if (bytes + length > 75) {
      parts.push(part);
      part = " ";
      bytes = 1;
    }
    part += character;
    bytes += length;
  }
  parts.push(part);
  return parts.join("\r\n");
}

function nextDay(date: string): string {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + 1);
  return day.toISOString().slice(0, 10).replace(/-/g, "");
}

Deno.serve(async (request: Request) => {
  if (request.method !== "GET") return new Response("Method not allowed", { status: 405, headers: { Allow: "GET" } });
  const url = Deno.env.get("SUPABASE_URL");
  let key: string | undefined;
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}");
    key = typeof keys.default === "string" ? keys.default : undefined;
  } catch (error) {
    console.error("Invalid Supabase publishable key configuration", error);
    return new Response("Calendar is not configured", { status: 500 });
  }
  if (!url || !key) {
    console.error("Missing Supabase environment variables");
    return new Response("Calendar is not configured", { status: 500 });
  }

  const signups: Signup[] = [];
  for (let offset = 0; ; offset += 1000) {
    const query = new URL(`${url}/rest/v1/prayer_signups`);
    query.searchParams.set("select", "id,prayer_date,display_name,created_at");
    query.searchParams.set("order", "created_at.asc,id.asc");
    query.searchParams.set("offset", String(offset));
    query.searchParams.set("limit", "1000");
    let response: Response;
    try {
      response = await fetch(query, { headers: { apikey: key } });
    } catch (error) {
      console.error("Unable to reach the signup database", error);
      return new Response("Unable to load prayer calendar", { status: 502 });
    }
    if (!response.ok) {
      console.error("Unable to load signups", response.status);
      return new Response("Unable to load prayer calendar", { status: 502 });
    }
    const page: Signup[] = await response.json();
    signups.push(...page);
    if (page.length < 1000) break;
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//A Village of Prayer//Baby Mathew//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:A Village of Prayer for Baby Mathew",
    ...signups.flatMap((signup) => [
      "BEGIN:VEVENT",
      `UID:${signup.id}@baby-mathew-prayer`,
      `DTSTAMP:${new Date(signup.created_at).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`,
      `DTSTART;VALUE=DATE:${signup.prayer_date.replace(/-/g, "")}`,
      `DTEND;VALUE=DATE:${nextDay(signup.prayer_date)}`,
      `SUMMARY:${escapeText(`Praying for baby Mathew: ${signup.display_name}`)}`,
      "DESCRIPTION:Join in prayer for baby Mathew.",
      "END:VEVENT"
    ]),
    "END:VCALENDAR"
  ];
  return new Response(lines.map(foldLine).join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff"
    }
  });
});
