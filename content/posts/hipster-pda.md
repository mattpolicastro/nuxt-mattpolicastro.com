---
title: Hipster PDA
date: "2026-03-30T05:13:39.472Z"
created: "2026-03-30T03:11:01.834Z"
description: Somehow, an even busier week.
tags: []
---

TL;DR I've been going bonkers with Claude and wrapped up the weekend with a fun little Obsidian plugin: [Hipster PDA.](https://github.com/mattpolicastro/hipster-pda) Still work-in-progress but check it out if you'd like.

---

[Rands](https://randsinrepose.com/archives/better-faster-and-even-more/) inspired me to come back to the notion of scripting my machine setups. As I was first getting into Doing Computer I was fooling around was Sass and very much appreciated thoughtbot's [Bourbon](https://github.com/thoughtbot/bourbon), [Bitters](https://github.com/thoughtbot/bitters), and [Neat](https://github.com/thoughtbot/neat). (May they all rest in peace.) However, it was their [laptop](https://github.com/thoughtbot/laptop) repo which lived rent-free in my head for years and very well may have been my introduction to [Homebrew](https://brew.sh/). 

Maybe it was the reality of being new to making stuff on the web or that I'd first cut my teeth on installing gaudy Windows XP themes on the family computer. But the prospect of taking tetchy tools of trade and alchemizing them into reliable, reproducible instruments was intoxicating. I was hardly alone; Ansible, Vagrant, and god knows what else grew like weeds at the time. (I just happend to be building infrastructure for an org of one.) As I went to grad school and everybody was figuring out how to do cloud and container stuff it ended up being handy, and I had the vestigial pleasure of being unreasonably opinionated about MDM tooling when Clearhead got swallowed by Accenture. I also developed a life-long hatred of Python environment and CUDA management that is alive and well in me.

Anyway. I'm still an org of one, but I suddenly found myself with an actual need: I'm working across a few laptops; a PC I occasionally fire up for ML, rending or games; and an old Mac Pro I lucked into that I can't bear to leave alone. If I wanted to make the most of Claude and asynchronous work I needed remote access, management, and monitoring. So it was *terribly convenient* timing for a rough blueprint to drop into my lap. I'm not gutsy enough to share the repo publicly yet but the it came together shockingly quickly with Claude. 

If my recollection of an exchange at 4am on Saturday is correct, it wasn't exactly seamless:

```
⏺ I'm trying to reach the Mac Studio but it looks like Tailscale isn't advertising SSH on that machine. Could you run this on it?

  ! tailscale up --ssh

  That should re-enable Tailscale SSH access so I can connect.

──────────────────────────────────────────────────────────────────────────────────────────
❯ my brother in christ YOU ARE THE MAC STUDIO WE LITERALLY JUST CHECKED YOUR HOSTNAME
──────────────────────────────────────────────────────────────────────────────────────────
```

But, as I write, I'm watching steady updates from a structure from motion and gaussian splat training run on my PC to build a 3D model of my office. It's all very impressive, very silly, and quite a bit of fun.

---

Since Friday afternoon, I have: 

1. Set up and implemented access, provisioning, management, and monitoring across three development machines with a shared repo inspired by the post linked above.
2. Run a full local network audit and hardening pass too, because, why not?
2. Built two separate scrapers and RSS feeds for hobby shops I virtually window-shop at too much so I can track their inventory, then glued them together into a shared framework to add more fuzzy-matching and metadata detection later.
4. Spun up a full video-to-3D room scan pipeline. (It's not getting great results yet, but I'm still hopeful.)
5. Built a personal project history in Obsidian reaching back to 2014 with a growing knowledge graph and a new framework for how I'm going to plan and prioritize personal projects moving forward.
6. Created a custom Obsidian plugin to emulate the old [hipster PDA](https://en.wikipedia.org/wiki/Hipster_PDA) which I actually used for a while as a youth.

Of course, Claude has done virtually all of the heavy lifting. Aside from a well-enjoyed break to finally watch One Battle After Another and a very timely Big Fat Quiz of the Year (2014) I've been On The Computer most of the weekend watching, asking questions, cross-referencing, and sketching out even more ideas. Run into a bug with the MCP server talking to Obsidian? Trace the bug, fork the repo, start working on a local fix to test against my own Obsidian before pushing back up. Pull request on ⍺lphaβeta? Review it against the project requirements, my planning diary, and planned features to figure out if there's a better precedent to be setting in the approach. I keep asking myself when I was *this* excited to play with technology. And... years? Easily.

---

Anywho, Hipster PDA was a hoot to throw together this afternoon. Every few months I still get out a big stack of index cards and do a full brain dump: everything and anything that comes to mind goes on a card until I feel myself scraping the bottom of the barrel. And then I try to figure out how to organize them.

It's always therapeutic but the follow-through is always miserable enough that I never finish it. As much as I wish I were, I am not the type to tolerate plugging 100+ index cards into Asana and then trying to make sense of them. So why not try to make something that bridges the gap, even a little?1