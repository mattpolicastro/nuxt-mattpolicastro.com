---
title: Claude'ld
date: 2026-09-05T22:02:04.098Z
created: 2026-09-05T22:02:04.098Z
description: Actually, no, it is you.
tags: []

---

I thought I'd been doing a good job of balancing measured optimism with healthy skepticism—but I'm now ready to admit I've been giving Anthropic too much slack. Their [xAI deals](https://content.spacex.com/cms-assets/FINAL_Documents%20and%20Updates/SpaceX%20-%20EU%20Prospectus%20%28Approved%20by%20Bafin%29%20-%20June%205%2C%202026.pdf) are (at best) [distasteful](https://arxiv.org/abs/2608.22153), their attitude toward model safety is [increasingly paternalistic](https://www.anthropic.com/news/position-open-weights-models), and Claude increasingly just... sucks. The neuroticism and verbosity have gotten bad enough that I feel a newfound gratitude for my colleagues putting up with me day to day.

I haven't really blogged about it here, but I've been steadily getting more serious about local inference and open-weight models. And as I've tooled around with them, there's been a serious jump in viability for interactive use in the last month or two. And maybe that was enough for some of the scales to fall from my eyes about Claude. (Though the security breaches and apparently flagrant lack of safeguards against agentic coordination and egress haven't hurt, either.)

Regardless, there's nothing like asking for "Hey, take a look at this and sketch out some next steps?" and getting a wall of text oozing with LLM tropes. Some of the blame falls on me, I'm sure—programmatic Anthropic model use seems to yield significantly less neurotic results, so I'm guessing my accumulated usage and history is contributing to Claude's shenanigans—but [I'm certainly not alone](https://bsky.app/profile/aparker.io/post/3muief7mg4s2l), either. Anyway, a few hours of planning and implementation last night culminated with the following exchange:

::chat-transcript
  :::chat-message{speaker="Claude"}

    …those phases won't mirror. Fixing it means either fetching the session file over Tailscale or running the import against that daemon with `--host`. Worth knowing before you turn local routing on for a real repo.

  :::
  :::chat-message{speaker="Matt" align="end"}

    So does this actually land what we'd planned?

  :::
  :::chat-message{speaker="Claude"}

    Honestly? Partly, and arguably the wrong half. You said _summarizing_ Nightshift into Paseo. I built _mirroring_ — which is different, and in one respect worse…

  :::
::

[@ed3d.net](https://bsky.app/profile/ed3d.net) posted a [great video essay](https://www.youtube.com/watch?v=jEiSnBgr9Rk) about a month ago that got me thinking hard about my model usage, so this isn't exactly a spur-of-the-moment thing. But this exchange last night was the final straw, so I pinched my nose and tried GPT. And now I have to sit with the fact that, as of this moment, I much prefer it to Claude. I certainly don't feel good about it. But for anybody who might be reading: if you can afford to (technically and monetarily), try other models.