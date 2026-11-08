(() => {
  "use strict";

  const start = "2026-11-08";
  const end = "2026-12-17";
  const config = window.PRAYER_CONFIG || {};
  const url = (config.supabaseUrl || "").replace(/\/+$/, "");
  const key = config.supabasePublishableKey || "";
  const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) && !!key;
  const storagePrefix = `prayer-signup:${url}:`;
  const grid = document.getElementById("calendar-grid");
  const participants = document.getElementById("participants");
  const message = document.getElementById("form-message");
  const form = document.getElementById("signup-form");
  const submit = form.querySelector('button[type="submit"]');
  let selected = start;
  let month = 10;
  let signups = [];
  let loaded = false;
  let saving = false;
  let storageAvailable = false;

  function dateKey(day, monthIndex) {
    return `2026-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function readableDate(value) {
    const [year, monthNumber, day] = value.split("-").map(Number);
    return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })
      .format(new Date(Date.UTC(year, monthNumber - 1, day)));
  }

  function storedToken(id) {
    if (!storageAvailable) return null;
    try {
      return localStorage.getItem(storagePrefix + id);
    } catch (error) {
      storageAvailable = false;
      message.textContent = "This browser cannot access its saved signup keys. Enable browser storage and reload the page.";
      return null;
    }
  }

  function render() {
    document.getElementById("month-label").textContent = month === 10 ? "November 2026" : "December 2026";
    document.getElementById("previous-month").disabled = month === 10;
    document.getElementById("next-month").disabled = month === 11;
    grid.replaceChildren();
    const firstWeekday = new Date(Date.UTC(2026, month, 1)).getUTCDay();
    const days = new Date(Date.UTC(2026, month + 1, 0)).getUTCDate();
    for (let i = 0; i < firstWeekday; i++) {
      const blank = document.createElement("span");
      blank.className = "calendar-blank";
      grid.append(blank);
    }
    for (let day = 1; day <= days; day++) {
      const date = dateKey(day, month);
      const count = signups.filter((entry) => entry.prayer_date === date).length;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "day" + (date === selected ? " selected" : "");
      button.disabled = date < start || date > end;
      button.setAttribute("aria-label", `${readableDate(date)}${loaded ? `, ${count} ${count === 1 ? "person" : "people"} praying` : ""}`);
      button.setAttribute("aria-pressed", String(date === selected));
      const number = document.createElement("span");
      number.textContent = day;
      button.append(number);
      const indicator = document.createElement("span");
      indicator.className = count ? "day-count" : "day-dot";
      if (count) indicator.textContent = `${count} 🤍`;
      indicator.setAttribute("aria-hidden", "true");
      button.append(indicator);
      button.addEventListener("click", () => { selected = date; render(); });
      grid.append(button);
    }
    document.getElementById("selected-date").textContent = readableDate(selected);
    participants.replaceChildren();
    const entries = signups.filter((entry) => entry.prayer_date === selected);
    if (!loaded || !entries.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = !loaded ? "Prayer signups are not available yet." : "No one yet — be the first!";
      participants.append(empty);
    } else {
      for (const entry of entries) {
        const item = document.createElement("div");
        item.className = "participant";
        const name = document.createElement("strong");
        name.textContent = entry.display_name;
        item.append(name);
        if (entry.additional_name) {
          const extra = document.createElement("span");
          extra.textContent = `Also praying for: ${entry.additional_name}`;
          item.append(extra);
        }
        if (storedToken(entry.id)) {
          const remove = document.createElement("button");
          remove.type = "button";
          remove.className = "text-button";
          remove.textContent = "Remove my signup";
          remove.setAttribute("aria-label", `Remove my signup for ${readableDate(entry.prayer_date)}: ${entry.display_name}`);
          remove.disabled = saving;
          remove.addEventListener("click", () => removeSignup(entry.id));
          item.append(remove);
        }
        participants.append(item);
      }
    }
    submit.disabled = !loaded || !storageAvailable || saving;
  }

  async function loadSignups() {
    const all = [];
    for (let offset = 0; ; offset += 1000) {
      const response = await fetch(`${url}/rest/v1/prayer_signups?select=id,prayer_date,display_name,additional_name&order=created_at.asc,id.asc&offset=${offset}&limit=1000`, {
        headers: { apikey: key }
      });
      if (!response.ok) throw new Error(`Could not load signups (${response.status}).`);
      const page = await response.json();
      if (!Array.isArray(page)) throw new Error("The signup service returned an unexpected response.");
      all.push(...page);
      if (page.length < 1000) return all;
    }
  }

  async function refresh() {
    try {
      signups = await loadSignups();
      loaded = true;
      render();
      return true;
    } catch (error) {
      loaded = false;
      message.textContent = `${error.message} Please refresh the page to try again.`;
      render();
      return false;
    }
  }

  async function callRpc(name, body) {
    const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`The signup service returned ${response.status}.`);
    return response.json();
  }

  async function removeSignup(id) {
    const token = storedToken(id);
    if (!token || saving) { render(); return; }
    saving = true;
    message.textContent = "Removing your signup…";
    render();
    try {
      const removed = await callRpc("remove_prayer_signup", { p_id: id, p_token: token });
      if (removed !== true) throw new Error("The signup could not be removed. It may have already been removed.");
      const refreshed = await refresh();
      message.textContent = refreshed ? "Your signup was removed." : "Your signup was removed, but the list could not be refreshed. Please reload the page.";
    } catch (error) {
      message.textContent = `Could not remove your signup: ${error.message}`;
    } finally {
      saving = false;
      render();
    }
  }

  document.getElementById("previous-month").addEventListener("click", () => { month = 10; render(); });
  document.getElementById("next-month").addEventListener("click", () => { month = 11; render(); });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!loaded || !storageAvailable || saving) return;
    const name = document.getElementById("prayer-name").value.trim();
    const additionalName = document.getElementById("additional-name").value.trim();
    if (!name) {
      message.textContent = "Please enter your name or church name.";
      document.getElementById("prayer-name").focus();
      return;
    }
    saving = true;
    message.textContent = "Saving your prayer day…";
    render();
    try {
      const id = crypto.randomUUID();
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, "0")).join("");
      localStorage.setItem(storagePrefix + id, token);
      await callRpc("create_prayer_signup", {
        p_id: id, p_token: token, p_date: selected, p_display_name: name, p_additional_name: additionalName || null
      });
      form.reset();
      const refreshed = await refresh();
      message.textContent = refreshed ? "You’re on the calendar. Thank you for praying!" : "Your signup was saved, but the list could not be refreshed. Please reload the page.";
    } catch (error) {
      message.textContent = `Could not confirm your signup: ${error.message} Please refresh and check the calendar before trying again.`;
    } finally {
      saving = false;
      render();
    }
  });

  if (configured) {
    const subscribe = document.getElementById("subscribe");
    subscribe.href = `webcal://${url.slice("https://".length)}/functions/v1/prayer-calendar`;
    subscribe.hidden = false;
    document.getElementById("calendar-url").href = `${url}/functions/v1/prayer-calendar`;
    document.getElementById("calendar-url-container").hidden = false;
    try {
      if (!window.isSecureContext || !crypto.randomUUID || !crypto.getRandomValues) throw new Error("A secure HTTPS connection is required.");
      const probe = `${storagePrefix}storage-test`;
      localStorage.setItem(probe, "ok");
      localStorage.removeItem(probe);
      storageAvailable = true;
    } catch (error) {
      message.textContent = `Signups are unavailable: ${error.message} Enable browser storage and use the HTTPS site.`;
    }
    refresh();
  } else {
    message.textContent = "The signup page is not configured yet. Please ask the organizer to complete setup.";
  }
  render();
})();
