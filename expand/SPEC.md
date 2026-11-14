# Story expansion text: spec

StorySpark builds stories from templates. Stories must now be ~450 / ~1300 / ~2000 words, so we need large pools of
extra "units" (1-2 sentences each) that the engine weaves between the existing story beats.

## File format
`expand/<name>.json`, one file per shape plus `generic.json`:
```
{ "simple": { "setting": [..], "action": [..], "talk": [..], "feeling": [..], "trouble": [..], "hope": [..] },
  "rich":   { same six keys } }
```
Pools needed (omit a register that is not listed):
- cozy: simple only (toddlers/kids: bedtime, animal friends, kindness)
- quest: simple + rich (fairy tale, magic, adventure, fantasy, superheroes, historical)
- mystery: simple + rich (detective puzzles, thrillers)
- scifi: simple + rich (space, robots, dystopian)
- haunt: simple + rich (spooky-not-scary for kids; horror/psychological for adults)
- comedy: simple + rich
- romance: rich only (sweet teen romance; adult and dark romance)
- drama: rich only (school friendship, adult drama)
- generic: simple + rich (must work for ANY genre; neutral about magic/tech/ghosts)

## Counts
Shape files: 14 units per category (84 per register). generic.json: 20 per category (120 per register).

## Categories
- setting: where they are, what it looks and sounds and smells like (use {P}, {P2}, {W})
- action: {H} (and/or {A}, {A2}) doing something concrete: walking, searching, climbing, hiding, trying
- talk: a short spoken exchange or one line of dialogue with a speech tag, between {H} and {A}/{A2}/{V}/{L}. Use straight double quotes escaped as \" in JSON
- feeling: {H}'s inner thoughts or feelings, a memory, a doubt, a decision
- trouble: a complication, a threat, a mistake, a clue that makes things harder (use {V}, {I}, {P2})
- hope: a small win, a joke, a kind moment, relief, a spark of courage

Units are mixed in any order, so each must stand alone and must NOT assume anything from the previous unit
(no "Then", "Again", "As before", "the other", "second time"; do not state the story is ending; do not solve the story's main problem).
Do not say "suddenly" more than twice in a pool. Vary sentence openings (not every unit starting with {H}).

## Length of a unit
- simple register (toddlers/kids): short, clear sentences, 8-18 words per unit, easy words, warm tone, vivid but gentle. Nothing frightening in cozy; mild in quest/mystery/haunt (spooky-not-scary: gentle, funny-spooky).
- rich register (teens/adults): 14-30 words per unit, specific sensory detail, subtext, varied rhythm, no clichés piled up. Teen romance stays sweet; adult/dark romance and horror may be intense but not explicit or gory.

## Slots (the ONLY allowed placeholders)
- {H} hero's name (always a name; use it freely, there is no gender)
- {A} {A2} two helpers or friends. They are phrases like "a wise old wizard called Orin" or "a loyal best friend called Meera" (an article + lower-case description + name), so never write "{A}'s" and never put {A} after "the"; a unit may START with {A}
- {V} the trouble-maker: could be "the Shadow Queen", "a misunderstanding", "a rival", "something old that had been waiting". Never write "{V}'s". Never use a pronoun for {V}; repeat {V} or write "the trouble"/"it" only if the sentence is still clear
- {P} the main place, {P2} a place passed on the way (every use of {P2} picks a DIFFERENT place), e.g. "the silver river"; write "at {P}", "through {P2}", not "the {P2}"
- {I} the special item, e.g. "the Moonstone amulet" (starts with "the"); write "{I}", not "the {I}"
- {W} a ready-made clause with no capital and no end punctuation, e.g. "lanterns floated by themselves"; use as "..., and {W}." or "Nearby, {W}."
- {T} a verb phrase for a plan, e.g. "follow the songs of the river": use as "what if we {T}?" or "{H} decided to {T}."
- {L} (romance only) the love interest's name, a plain name
Do not invent other slots. Do not use curly braces for anything else.

## Hard rules (checked by `node expand/check.js`)
- No gendered pronouns for anyone: never he, she, him, her, his, hers, himself, herself, boy, girl, man, woman, mother, father, mum, dad (relationships like "a wise grandmother" are fine only inside the lexicon, not in your units).
- Never name a character other than via slots. Never use real brands, songs or copyrighted characters.
- No duplicates inside a file. Each unit ends with . ! ? or a closing quote after punctuation.
- Every unit uses at least one slot OR is vivid enough to be placed anywhere; at least 60% of units contain a slot.
- UK/Indian-friendly English spelling (colour, grey).
- Make every unit different in rhythm and imagery; no filler like "something was about to happen".
