---
name: wcl-raid-review
description: Analyze a Warcraft Logs report (warcraftlogs.com/reports/<code>) for Zak's guild Sanity Capped and turn it into a raid-night review data page with a personal section for Zak's character Bigchomper. Use when Zak shares a Warcraft Logs link, asks how the raid or a player did, what caused wipes, what to improve, or wants a log review, raid recap or parse comparison.
---

# Warcraft Logs raid review

Zak plays **Bigchomper** (Devastation Evoker) in **Sanity Capped**, Illidan (US), a Mythic progression guild.
A review is a page in this repo that shows how the raid did, what ended pulls, how each player did, and
a **personal Bigchomper section**: his best and worst pulls and what to do better. Include that section
whenever Bigchomper is in the log, even if Zak doesn't ask. Talk to him as "you" in chat. On the page,
call him "Bigchomper", since other raiders will read it.

Past reviews (copy their structure and design, and compare against them):
- `venomous-abyss-oct1-raid/`: Sszorak kill and 23 Twin Fangs pulls.
- `venomous-abyss-oct7-raid/`: Nymrissa kill and 32 Twin Fangs pulls, plus the first Bigchomper section.
  This is the current template.

## 1. Pull the data (Claude in Chrome)

The public report pages work without logging in. You don't need an API key; don't go looking for one.

1. Load the Chrome tools in one ToolSearch call. Include `javascript_tool`, `navigate`, `computer`,
   `tabs_context_mcp` and `tabs_close_mcp`. Open the report URL in a new tab.
2. Read `wcl.js` (next to this file) and pass its **entire contents** as the `text` of one `javascript_tool`
   call. That defines `window.WCL`. It is wiped whenever the tab navigates, so stay on the report page.
   If you do navigate (for example to find a new endpoint), paste the file again.
3. `await WCL.load('<code>')` returns every boss pull (`id:name:HP%|K:length`).
   `await WCL.loadAll()` then fills `WCL.data[fightId] = {deaths, dmg, heal}` for all boss pulls (about 10s).
4. Extra data as needed:
   - Per-player breakdowns: `WCL.byAbility(fight, 'damage-taken' | 'casts' | 'healing', playerId)`.
   - Cast timelines: `WCL.casts(fight, playerId)` returns `[[secondsIntoPull, ability], ...]`.
   - Use `WCL.pool(items, fn)` to loop over players × pulls.
   - Player ids come from `WCL.players`. Rows in the damage tables are **not sorted**, so sort them yourself.

### Getting data out (important)
- Tool results are cut off at about **1000 characters**. Results containing `=` or `&` can come back as
  `[BLOCKED: Cookie/query string data]`. So aggregate in the page with JS, and return compact strings that
  use `:` `|` `,` as separators. For bigger dumps, use `WCL.put(obj)`, then `WCL.page(0)`, `WCL.page(1)`, …
  until you see `END`.
- **Don't** try to send data to a localhost server, open a popup, or inject an iframe to get around this.
  The permission classifier blocks those (it did on Oct 7). Don't dig through other projects' transcripts
  or the `API Keys` folder either; that was blocked too. Chunked reads are fine: an Oct 7 review needed
  about 15 of them.
- Write the numbers you'll use into the page's data arrays as you go, so you don't have to fetch them again.

## 2. What to measure (keep it consistent week to week)

- **Wipe moment** = time of the pull's **10th death**. **Ended by** = the killing blow behind most deaths
  within ±4s of that moment. Check by hand when several mechanics land together, and use these categories:
  first, second or third Burst; Globule; Feast; Stone Breaker; opener wipe; or another named mechanic.
- **Early death** = more than 5s before the wipe moment. **First death** = the first death of the pull.
- **Average DPS/HPS** = total amount ÷ total seconds across the pulls the player was in, so longer pulls
  count for more. Get "was in" from `WCL.inFight(player, id)`, not from table rows. Healers use healing;
  everyone else uses damage.
- **Parses:** use the kill parse for kills. On wipes, show the average wipe parse and label it rough.
- **Progress vs last week:** best HP%, longest pull, pulls ended by each wall, pulls past each wall,
  death share by ability, and deaths per pull for new mechanics.
- **Report clock times:** a fight title like "Wipe 12 (40% at 10:26 PM)" gives one fight's local end time.
  Use it to anchor `start_time` offsets.

### Known quirks
- **Holy Priest** deaths barely log (probably Spirit of Redemption), so show "–" for their death counts.
- A battle res means a player can **die twice in one pull**. Count every death, not one per pull.
- **Duplicate names across characters:** on Oct 7, "Vilkas" was a Shadow Priest on Nymrissa and a Hunter
  later. Use the player id to keep them apart.
- Some players have no parse at all (Aarragorn on Oct 7). Show "–".
- Roster swaps happen mid-night (Bigchomper replaced Kedrilock at Twin Fangs pull 11). Say so on the page.
- Number pulls per boss (Twin Fangs pull 1..N, matching the "Wipe N" labels on Warcraft Logs), not by
  report fight id.

## 3. Bigchomper section

Pull these for each of his pulls:
- DPS and its rank among damage dealers, and the parse.
- Each death: time, killing blow, early or not, and death order in the pull.
- Defensive casts from `WCL.casts`: **Obsidian Scales** (12s, 2 charges), Renewing Blaze, Zephyr,
  Healthstone and potions.
- Damage taken by ability compared with the rest of the raid (from `byAbility` 'damage-taken'), to find
  avoidable damage where he takes the most.

The page should show:
- Tiles (average DPS and raid rank, pulls as top DPS, early and first deaths, defensive coverage of the
  big mechanic).
- A **per-pull timeline** with one row per pull: the boss Burst windows shaded, Scales casts as 12s bars,
  his death dots, a raid-wipe tick, and DPS · rank on the right.
- Best and worst pull cards.
- What killed him.
- A short ranked "What to aim for" list.

Oct 7 baseline to compare against:
- 358k average DPS, raid #1, top on 17 of 21 pulls.
- 5 early deaths; Visceral Burst killed him 7 times.
- Scales was active for the second Burst on only 4 of 18 pulls; Healthstone was used once in 22 pulls.
- Most Toxic Fumes taken in the raid.

Check whether these improved and say so plainly, good or bad.

## 4. Boss notes (add to this as we learn more)

**The Twin Fangs (Mythic, The Venomous Abyss)**, from logs plus Method, Mythic Trap and the Warcraft Wiki:
- **Visceral Burst** kills in waves at about **0:45–0:52**, **1:43–1:58** and **3:18–3:30**.
  The second wave was the main wall on both Oct 1 and Oct 7.
- **Caustic Globule:** players at max **Eternal Venom** stacks (9 or 10; the sources disagree) drop
  globules on death. Any crowd control removes their **Barbed Bulwark** shield. The deaths cluster at
  about 1:22.
- **Ravenous Feast:** a soak at about 2:00 that consumes Eternal Venom stacks. On Heroic it leaves a
  vulnerability debuff (one soak per set); this isn't confirmed for Mythic. It became the wall behind the
  second Burst on Oct 7, often after players were lost at the Burst.
- **Stone Breaker:** mass deaths at 3:00–4:00. The Wiki says the platform reverberates if it hits no
  player. It ended both of the best Oct 7 pulls.
- **Concentrated Spittle** on the tank at 0:05 caused both opener wipes on Oct 7.
- **Toxic Fumes:** constant damage, and avoidable to some degree (Bigchomper took the most).

**Nymrissa Wavecaller:** killed Oct 7 (pull 3, 6:47). Wipes came from Shatter (a mass death around 2:08)
and Frost Burst, Water Jet and Abyssal Rain around 0:55.

**Sszorak:** killed Oct 1 (pull 11). Wipes came from Venomous Surge, Virulence, and
Mutilate / Mutilated Gash.

Present mechanic notes from guides as "per Method" etc., and point out where sources disagree.
Link the guides in the page's method section.

## 5. Build and publish

- Start from the latest review's `index.html`. Reuse its CSS, the chart helpers (`el`, `tooltip`,
  `hover`, `bars`), and its section order: header tiles → short version → every pull → per-boss
  sections → player table → what to work on → Bigchomper → method → footer link to the previous week.
- Write the fragment in the scratchpad.
- Preview it by serving the repo with `python -I -m http.server <port> --bind 127.0.0.1` in the
  background and opening it in Chrome (Chrome won't open `file://` URLs).
- Check that every SVG chart and table rendered: count `svg`, `.bar-row` and table rows. A helper called
  without its fallback argument once stopped every chart below it from rendering.
- Before publishing, re-check every number in the prose against the data you pulled.
- Publish with the **publish-page** skill, using slug `<raid-slug>-<mon><day>-raid`
  (for example `venomous-abyss-oct7-raid`). Commit as `add <slug>` and push. No Co-Authored-By line.
- Close any Chrome tabs and stop any servers you started.
- Finally, add the night's key numbers to the baselines in this file (sections 3 and 4) and commit that too.
