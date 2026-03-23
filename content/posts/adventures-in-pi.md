---
title: Adventures in Pi
date: "2015-05-12T00:00:00"
description: Blinded by science (and hacking in the real-er world).
tags: []
---

Last fall I bought a Raspberry Pi for kicks and really loved it—a delightfully simple introduction to Linux proper and more command-line tools. That said, I really didn't do much more with it than say, "Hey! I did a computer thing!" And despite fondness for [Brian X. Chen's neighbourhood camera](http://www.nytimes.com/2015/02/19/technology/personaltech/dropcam-keeps-an-eye-on-the-neighborhood.html?_r=0), taping my little neck of the woods was entirely too creepy.

And so I wandered off to noodle on other projects, casting a mild grimace at the Pi gathering dust on the shelf. That is, until I found [Johnny-Five](http://johnny-five.io).

Simply put, Johnny-Five is a fun Node library for interacting with hardware across all sorts of platforms. And it works terribly well! Aside from stumbling onto the fact that servos need to be calibrated after aimless puzzling, I was able to slap together a simple bot for raising and lowering blinds over a day or two. It's exactly the sort of fun I've been looking for in small weekend projects.

The blinds control flow/script is here as a [gist](https://gist.github.com/mattpolicastro/267fc5ad189c3c8c567b)—comments and suggestions are more than welcome. I've sketched out some automation/API features but I'm holding off until I'm a bit more confident in the actual hardware bits. (If the power goes out, a number of bits and bobs will go a-clattering to the ground.)
