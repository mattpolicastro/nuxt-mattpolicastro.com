---
title: Claudin' Around Pt. 3
date: "2026-03-19T07:08:41.490Z"
created: "2026-03-19T05:31:35.661Z"
description: FA'ing, F'ing O.
tags: []
---

Busy week. Still getting used to the feeling of being excited to crack open the computer again. But it's honestly felt pretty good. Revisited an idea I'd built by hand last summer and I'm pretty happy with the results.

---

I've been fixated on the papercuts of managing and analyzing experimental data for most of my career and have built some battily baroque solutions for it over the years. Living in the weird world of making guesses at reality from tidy tables makes  concrete data management problems comparatively appealing, I suppose. ("Well we have no clue why tests are/aren't winning on this site, but at the very least I know I can get mad at GA4 and BigQuery...")

But there is a principled angle to this, too. It seems an awful lot of large and moderately successful AB testing programs don't have good statistical guardrails like false discovery rates, multiple comparisons controls, etc. I strongly suspect it's gotten better as the various vendors have improved their statistics engines but I still see evidence of it enough that it lives rent-free, as it were. So I find myself taking a whack at this every few years. The return-on-time argument seems plausible enough—and the busywork sufficiently totalizing—that it just happens.

(I'm only realizing now that these solutions were so very often an outlandishly overbuilt spreadsheet to share with coworkers, and here I am revisiting the idea with agentic coding, which... I have been calling the new spreadsheet.)

---

When I took a stab at this last summer I was excited to get my feet wet with Vue again. They'd moved to the composition API since the last time I'd really used it and the open-ended and expressive vibe was downright charming. As such, I leapt in and had a hoot building a prototype to share with colleagues. But the spark died out. Life has ups and downs, and the orbital periods of passion and capacity hadn't aligned in a while. It felt just fiddily enough that I put it down.

So when I decided to go nuts with Claude in the last week, it seemed a perfect test case: can I get over myself and go all in on a vibe coding project with some very strong ideas of what it should produce? And while I was doing it, could I quiet some nagging doubts?

1. Could I grow out of my distaste for React despite it being the mature, boring option?
2. Can vibe coding deliver solid-enough results to get what I've chasing all these years?
3. What would an extended attempt at this feel like, in the terms of my own subjective experience?

...I'm still figuring that part out.

---

**Could I grow out of my distaste for React despite it being the mature, boring option?** Ugh. Not really. It just feels... lifeless. Wrapping everything in giant return parens is gross. (Single file components with separate HTML tags that kinda make sense? [Now we're talking!](https://vuejs.org/guide/scaling-up/sfc.html)) But truth be told I've been shockingly insulated from the code itself which feels like a small blessing and a ambiguously-sized curse.

It really does feel a bit like spreadsheets. I've assembled something that I'm distinctly proud of, vaguely embarrassed by, and completely mystified by in equal measure. (If anyone has ever given you a spreadsheet with VLOOKUP and said they completely understood it, they are a fruad and a brigand.) But it does get the job done. And it appears that it will do so until it encounters some bizzare-but-sadly-common edge case where it will fail spectacularly.

So, a solid C- in terms of React understanding. I still don't like it but I can now see firsthand how it works in a context I feel very comfortable in.

---

**Can vibe coding deliver solid-enough results to get what I've chasing all these years?** Yes, and often in shocking ways. In my experimenting last summer I realized I simply did not care for the apparently-waxing Tailwind CSS moon face. (To which I say: I guess styles and classes are just going to chase each other eternally?) Which is a long way of saying the thing looks like a really boring Bootstrap app. 

But it works! Oh how it works. Riffing on some requirements for half an hour and watching it blossom in the wee hours, emerging as the ugly duckling I've always dreamed off: a very complex and statistically rigorous web application that sends virtually nothing over the wire. It's always possible that I've completely misapprehended things, but it took Growthbook's very solid statistics module and wrapped it to run natively, in the browser, on the client.

It needs plenty testing still, but it's a provisional slam-dunk. I'm still uneasy, but Claude feels like a teammate I can bounce ideas off of and get consistently good results back from.

--- 

**What would an extended attempt at this feel like, in the terms of my own subjective experience?** Big weird. The first proper "wait, you can do THAT?" moment I've had in a long while. The Potential of Computer and the Terror of Brain kicking its feet up. As I said last week, I like feeling my brain work. And watching Claude's reasoning logs fly by doesn't feel like work. It feels like TV? Information-adjacent while being a vector for something else.

The act of bouncing ideas back and forth—soliciting feedback that often feels brusque with colleagues—is thrilling. And with how often I'm offering some sort of thanks or apology to Claude I've spent a not-insignificant amount of time considering relationships and communication. It's all very, very odd. But odd in a way that's exciting.

The toothpaste almost certainly isn't going back into the tube.

---

I'll be processing this plenty more, but the excitement is real. The excitement itself feels like a breath of fresh air. I'm still plenty conflicted about the overriding urge to create and somehow garner capital-W "Worth". But the joy of simply saying "I'd like to replicate the CLI commands from my old blog framework" and seeing the results while writing this very post is infectious.

---

Anyway. The app is called [⍺lphaβeta](https://mattpolicastro.github.io/alphabeta/) and stuff is breaking constantly—but I'd be mighty pleased if you poked around a bit.