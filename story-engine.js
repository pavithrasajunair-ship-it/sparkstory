/* StorySpark story maker. Builds a complete story from characters, an age group, a genre and a length,
   entirely on the device (no AI, no network). Works in the browser (window.SSEngine) and in Node. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./story-data.js"), require("./story-expand.js"));
  else root.SSEngine = factory(root.SSData, root.SSExpand);
})(typeof self !== "undefined" ? self : this, function (D, EXP) {
  const { TIERS, GENRES, LEX } = D;
  const NAMES = ["Aarav", "Neel", "Zoya", "Mira", "Kabir", "Anaya", "Rohan", "Isla", "Theo", "Naina", "Luca", "Sana"];

  // ---------- small helpers ----------
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const bare = (s) => s.replace(/^(the|a|an)\s+/i, "");
  const withThe = (s) => (/^(the|a|an|my|our|his|her|their|your)\s/i.test(s) ? s : "the " + s);
  const upFirst = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
  const SMALL = new Set(["a", "an", "the", "and", "of", "to", "for", "in", "at", "on", "by", "with"]);
  function titleCase(s) {
    return s.split(" ").map((w, i) => (i > 0 && SMALL.has(w.toLowerCase()) ? w.toLowerCase() : upFirst(w))).join(" ");
  }
  function tidy(text) {
    return text
      .replace(/\s+/g, " ")
      .replace(/(^|[.!?]\s+)(["“']?)([a-z])/g, (m, a, q, c) => a + q + c.toUpperCase())
      .replace(/([.!?,]["”]\s+)(?!(?:said|asked|replied|whispered|called|cried|shouted|answered|came|laughed|thought|added|says|yelled|squeaked|giggled|sang|hooted|groaned|sighed|grinned|muttered|declared|announced|gasped|exclaimed|moaned|chirped|roared|growled|cheered|murmured|snapped|begged|warned|wailed|hissed|sniffed|beamed|chuckled|continued|insisted|suggested|offered|promised|agreed|nodded|smiled|breathed|stammered|blurted|demanded|pleaded|admitted|breathes|replies|whispers|laughs|asks|tells|told|barked|boomed|teased|joked|sobbed|mumbled|urged|cautioned|reminded|repeated|reasoned|wondered|ventured|prompted|conceded|observed|noted|remarked)\b)([a-z])/g, (m, a, c) => a + c.toUpperCase())
      .replace(/\s+([,.!?])/g, "$1")
      // a speech tag that begins with a newly introduced person ("A wise grandmother called Nani asked") reads better in lower case
      .replace(/([?!,]")\s+(A|An)\s+([^.!?"\u201c\u201d]{3,60}?\s(?:asked|said|replied|whispered|added|answered|warned|laughed|called))\b/g, (m, q, a, rest) => q + " " + a.toLowerCase() + " " + rest)
      .trim();
  }

  // ---------- story shapes (the beats) ----------
  const S = {};
  S.quest = {
    simple: {
      opening: [
        "Once upon a time, {H} lived near {P}. Every day {H} wondered what adventures might be waiting.",
        "One bright morning, {H} woke up with a big idea. Today was the day to visit {P}!",
        "{H} loved exploring. One day, a little map fluttered in through the window, pointing straight to {P}.",
      ],
      call: [
        "The map showed where {I} was hidden. \"I must find it,\" said {H}.",
        "A tiny whisper floated by: \"Only {H} can find {I}.\" So {H} packed a bag and set off.",
        "{A} came running. \"Please help! {I} has gone missing, and I think you can find it!\"",
      ],
      journey: [
        "On the way, {H} passed {P2}, where {W}.",
        "{H} skipped past {P2}. It was a wonderful sight: {W}.",
        "Next came {P2}. {W}, and {H} could not stop smiling.",
      ],
      ally: [
        "Soon {H} met {A}, who knew every path. \"Let's go together!\" said {A}.",
        "Along the way, {A2} popped up and joined in. Now there were three friends on the adventure.",
        "{A} and {A2} walked beside {H}, and the road did not feel long at all.",
      ],
      obstacle: [
        "Suddenly, {V} stepped out and said, \"Nobody gets {I} today!\"",
        "Then {V} appeared, blocking the way. This was a problem.",
        "But wait! {V} had reached {P} first, and stood guard over {I}.",
      ],
      setback: [
        "{H} tried once, then twice, but it did not work. {A} looked worried.",
        "Oh dear. Everything went wrong, and {H} sat down with a big sigh.",
      ],
      insight: [
        "Then {H} had an idea. \"What if we {T}?\"",
        "{A2} whispered something clever, and {H} grinned. \"Yes! Let's {T}!\"",
      ],
      climax: [
        "So {H} and {A} did it together. {V} stopped, blinked, and began to look a little less cross.",
        "{H} took a deep breath and tried it. It worked, and {V} could only stare.",
      ],
      win: [
        "At last, {H} held {I}. It glowed warm and bright.",
        "Hooray! {I} was found, and everybody cheered.",
      ],
      ending: [
        "{H} walked home with a happy heart. The adventure was over, but the memory would last forever. {M}",
        "That night, {H} told everyone about the day. {A} and {A2} nodded and smiled. {M}",
      ],
    },
    rich: {
      opening: [
        "{H} had spent most of a life waiting for something to happen. When it finally did, it arrived quietly, at dusk, in the shape of {I}.",
        "Nobody around {P} thought {H} would ever leave. Then came the night the sky turned strange, and the road began to call.",
        "On the morning everything changed, {H} found a note under the door: three words, no signature. Find {I}.",
      ],
      call: [
        "Whatever {I} was, it mattered. {A} said it was the only thing standing between the world and {V}, and {H} could not pretend to have heard nothing.",
        "The trail began at {P}. {H} packed light, kept {A} close, and did not look back.",
        "{V} wanted {I}, and was not known for asking nicely. That settled it.",
      ],
      journey: [
        "The road wound through {P2}, where {W}. {H} had never seen anything like it.",
        "For three days they travelled. They crossed {P2}, where {W}, and slept badly, with one eye open.",
        "Past {P2}, {W}. {A} swore it had not been like that the last time.",
      ],
      ally: [
        "At dusk {H} met {A2}, who claimed to know the way and, to everyone's surprise, actually did.",
        "{A2} appeared from nowhere with a lantern and an opinion. By morning the company had grown to three.",
        "It was {A2} who first suggested that {V} could be outwitted rather than outrun.",
      ],
      obstacle: [
        "{V} was waiting. \"You are a long way from home,\" came the voice. \"Hand over {I}, and this ends well for everyone.\"",
        "The path ended at {P2}, and so did their luck. The danger arrived before they saw it: {V} was already here.",
        "They reached {P} just as {V} did, and the two groups stared at each other across the last stretch of open ground.",
      ],
      setback: [
        "The first attempt failed badly. {A} was knocked off balance, {H} lost the map, and for a long minute nobody spoke.",
        "{H} had been so sure. Now, with {I} slipping further away, doubt crept in and sat down heavily.",
        "That night, around a smoky fire, {A2} said what none of them wanted to hear: they could not win this by strength.",
      ],
      insight: [
        "Then, watching the firelight, {H} understood. \"We don't fight it,\" {H} said slowly. \"We {T}.\"",
        "It came to {H} all at once, the way the answer to a riddle does. There was one chance, and it was to {T}.",
      ],
      climax: [
        "It was the strangest fight {H} would ever remember, won with nerve and timing rather than strength. {A} gave the signal, and the plan began.",
        "{V} lunged; {H} stepped aside; and for one heartbeat everything hung on whether {I} would answer.",
      ],
      win: [
        "When the dust settled, {I} lay in {H}'s hands, warm and humming as though it had been waiting all along.",
        "{V} was defeated, or at least gone, which in a place like this amounted to the same thing.",
      ],
      ending: [
        "{H} went home by the long way, with {A} and {A2} for company. The world was the same size as before, but {H} no longer was. {M}",
        "Years later, people still told the story wrongly, and {H} never corrected them. The true version belonged to {A}, {A2} and one quiet night at {P}. {M}",
      ],
    },
    seq: ["opening", "call", "journey", "ally", "obstacle", "setback", "insight", "climax", "win", "ending"],
    short: ["opening", "call", "obstacle", "climax", "ending"],
    tiny: ["opening", "call", "ally", "obstacle", "insight", "win", "ending"],
    extra: ["journey", "setback", "ally", "obstacle"],
    long: { first: ["opening", "call", "journey"], mids: [["ally", "journey", "obstacle"], ["setback", "ally", "insight"]], last: ["climax", "win", "ending"] },
  };

  S.cozy = {
    simple: {
      opening: [
        "Once upon a time, in {P}, there lived {H}. It was the end of a long, happy day.",
        "The sun was getting sleepy over {P}, and {H} was getting sleepy too.",
      ],
      wish: [
        "{H} yawned and wished for {I}. \"I would love to see it before bed,\" said {H}.",
        "{H} looked up and sighed. \"If only I could find {I},\" said {H}.",
      ],
      friend: [
        "Just then, {A} came along. \"Hello, {H}! I'll help you find it.\"",
        "Along came {A}, with a wide, warm smile. \"Let's look together,\" said {A}.",
      ],
      trouble: [
        "But oh dear, {V} was in the way, and looked a little sad and a little grumpy.",
        "Then they met {V}, who was feeling very cross and very small.",
      ],
      kind: [
        "{H} and {A} decided to {T}. And guess what? {V} smiled a big, soft smile.",
        "{H} was kind. {H} and {A} chose to {T}, and the grumpiness melted away like butter.",
      ],
      happy: [
        "Then {I} appeared, glowing softly. {W}.",
        "And there was {I}, right where it should be. {W}.",
      ],
      goodnight: [
        "Soon it was time for bed. {H} snuggled down, with {A} and {A2} close by. {M} Goodnight, {H}. Sleep tight.",
        "{H} closed both eyes, with a big yawn. {A2} and {A} tiptoed away. {M} Goodnight, {H}.",
      ],
    },
    seq: ["opening", "wish", "friend", "trouble", "kind", "happy", "goodnight"],
    short: ["opening", "wish", "friend", "trouble", "kind", "goodnight"],
    tiny: ["opening", "wish", "friend", "trouble", "kind", "happy", "goodnight"],
    extra: ["friend", "trouble"],
    long: { first: ["opening", "wish", "friend"], mids: [["trouble", "kind"]], last: ["happy", "goodnight"] },
  };
  S.cozy.rich = S.cozy.simple;

  S.mystery = {
    simple: {
      opening: [
        "{H} was the best finder of lost things in the whole neighbourhood. One day, a real mystery arrived at {P}.",
        "It started on an ordinary Tuesday. {I} had vanished from {P}, and nobody knew where.",
      ],
      discovery: [
        "{H} looked around. \"Something is odd here,\" said {H}. {W}.",
        "{H} knelt down and studied the room. {W}. Somebody wanted this to look easy.",
      ],
      clue: [
        "Near {P2}, {H} spotted {C}. \"Aha! That's a clue,\" said {H}.",
        "{A} pointed. \"Look, {C}!\" It might be important.",
      ],
      suspect: [
        "Soon there were suspects. Was it {V}? {V} looked nervous, but that didn't mean much.",
        "{V} had been near {P} that day, and could not quite explain why.",
      ],
      clue2: [
        "Behind {P2}, {A2} found {C}. The puzzle pieces were starting to fit.",
        "{A2} laid {C} next to the first clue. Now they had a pattern.",
      ],
      twist: [
        "But wait. Something did not add up. {H} thought hard, and {A} scratched a head.",
        "Then {H} gasped. All along, they had been looking in the wrong place!",
      ],
      confront: [
        "{H} gathered everybody together. \"I know what happened,\" said {H}. \"We just need to {T}.\"",
        "\"Here is my plan,\" said {H}. \"First, we {T}. Then we'll know.\"",
      ],
      solve: [
        "And so the mystery was solved. {I} was safe, and {V} said sorry. {H} smiled.",
        "It all made sense at last. {I} was found, and everyone clapped for {H}.",
      ],
      ending: [
        "{H} wrote it all in a notebook, with {A} and {A2} looking proudly over a shoulder. {M}",
        "That evening, {H} put the case file away, ready for the next mystery. {M}",
      ],
    },
    rich: {
      opening: [
        "The call came at 6:40 on a Thursday. {I} was gone, {P} was in uproar, and everyone who could have helped seemed to be somewhere else.",
        "{H} had no reason to be at {P} that night, which is perhaps why {H} noticed what the others missed: {I} was gone, and nobody had heard a thing.",
      ],
      discovery: [
        "Inside, {W}. {H} crouched down and looked closer. Someone had wanted this to look simple.",
        "The scene was tidy in the wrong way. {W}, and {H} felt the first cold prickle of certainty that this was no accident.",
      ],
      clue: [
        "Near {P2}, {H} found {C}. It meant little by itself; with the right pieces beside it, it meant everything.",
        "{A} was the one who spotted {C}, half-hidden. They exchanged a look. Neither of them said what both were thinking.",
      ],
      suspect: [
        "The obvious suspect was {V}. It was too obvious, and that was the problem.",
        "{V} had a motive, an alibi, and a nervous habit of explaining things nobody had asked about.",
      ],
      clue2: [
        "By midnight they had a second clue: {C}. {A2} laid it beside the first, and a shape began to emerge.",
        "At {P2}, {A2} turned up {C}. It did not fit the story everyone had been telling, which meant the story was wrong.",
      ],
      twist: [
        "Then the story turned. What {H} had believed for hours was exactly what someone had wanted believed.",
        "It was {A} who said it aloud, quietly: they had been shown the wrong thing, and been grateful for it.",
      ],
      confront: [
        "{H} gathered everyone at {P}. \"I'll tell you what happened,\" {H} said, \"and I'll tell you how I know.\" Quietly, {H} had decided to {T}.",
        "There was only one way to be sure. {H} chose to {T}, and then waited, and watched who moved first.",
      ],
      solve: [
        "It all fell into place. {I} was found, {V} was caught out, and the truth, plain at last, was almost disappointing.",
        "The truth was smaller than the lies, as it usually is. {I} came back; {V} did not look anyone in the eye.",
      ],
      ending: [
        "Afterwards, {H} sat with {A} and {A2} and went over it once more. Every case ends with the sense of having missed something, and {H} filed that thought away for next time. {M}",
        "Later, alone, {H} turned {C} over in one hand. Solved was not the same as finished. {M}",
      ],
    },
    seq: ["opening", "discovery", "clue", "suspect", "clue2", "twist", "confront", "solve", "ending"],
    short: ["opening", "clue", "suspect", "confront", "solve"],
    tiny: ["opening", "clue", "suspect", "confront", "solve"],
    extra: ["clue", "clue2", "suspect", "discovery"],
    long: { first: ["opening", "discovery", "clue"], mids: [["suspect", "clue2"], ["clue", "twist"]], last: ["confront", "solve", "ending"] },
    darkAfter: ["twist"],
  };

  S.haunt = {
    simple: {
      opening: [
        "It was a dark and windy night, and {H} had decided to visit {P}. Just to look. Just for a minute.",
        "Everyone said {P} was spooky. {H} wanted to find out for sure, and brought {A} along.",
      ],
      arrival: [
        "Inside, {W}. {H} gulped, and held on to {A}.",
        "{H} stepped through the door. {W}. It was a bit chilly, and a bit exciting.",
      ],
      strange: [
        "Then {S}. {H} jumped! \"Did you hear that?\" whispered {A}.",
        "Suddenly, {S}. {H} froze, and then very slowly turned around.",
      ],
      strange2: [
        "Another strange thing happened near {P2}: {S}. {H} peeked, very slowly.",
        "By {P2}, {S}. \"It's only the wind,\" said {H}, but {H} didn't sound very sure.",
      ],
      escalate: [
        "Suddenly {V} popped out! \"Boo!\" said {V}. {H} squeaked, then burst out laughing, because {V} looked more worried than scary.",
        "Then {V} came out from behind {I}, trembling more than they were.",
      ],
      reveal: [
        "It turned out {V} was only looking for {I}, and had been too shy to ask.",
        "{V} was not scary at all. {V} was lonely, and had been waiting for someone to visit.",
      ],
      climax: [
        "{H} and {A2} decided to {T}. {V} smiled for the first time in a hundred years.",
        "{H} took a brave breath and chose to {T}. All the shadows seemed to relax.",
      ],
      ending: [
        "From then on, {P} wasn't spooky at all. {H} visited often, and {V} always waved. {M}",
        "{H} went home feeling braver than ever, and slept very well. {M}",
      ],
    },
    rich: {
      opening: [
        "Nobody had warned {H} about {P}. That was the first thing wrong with it: someone should have.",
        "{H} arrived at {P} just after dark, with {A}, a torch, and the kind of confidence that disappears quickly.",
      ],
      arrival: [
        "Inside, {W}. {A} laughed once, and then stopped laughing.",
        "The door swung shut behind them. {W}. It was only then that {H} noticed there was no sound from outside at all.",
      ],
      strange: [
        "Then {S}. {H} told {A} it was just the pipes. Neither of them believed it.",
        "Without warning, {S}. {H} held very still, in the way you do when you hope that being quiet makes you invisible.",
      ],
      strange2: [
        "Near {P2}, {S}. The torch flickered, steadied, and showed {I} exactly where it hadn't been before.",
        "At {P2}, {S}. {A} said the building was settling. The building, it seemed, had other ideas.",
      ],
      escalate: [
        "By midnight it was no longer possible to pretend. {V} was here, and knew {H}'s name.",
        "Somewhere between one room and the next, the rules changed. {V} stopped hiding and began to follow.",
      ],
      reveal: [
        "{A2} found the truth in an old record: whatever lived in {P} had been held there by {I}, and by the people who had once loved it enough to fear it.",
        "It all made a terrible sort of sense. {V} had never wanted to hurt anyone; it only wanted not to be forgotten, and {I} was how it was being kept.",
      ],
      climax: [
        "{H} understood what had to be done. Not fighting, not running. They would {T}.",
        "There was one chance, and it was a strange one. {H} stepped forward and chose to {T}.",
      ],
      ending: [
        "By morning {P} was only a building, and {V} was only a story. {H} and {A} said nothing on the drive home. {M}",
        "The sun came up as if nothing had happened. {H} looked back at {P} once, and decided never to look again. {M}",
      ],
    },
    seq: ["opening", "arrival", "strange", "strange2", "escalate", "reveal", "climax", "ending"],
    short: ["opening", "strange", "escalate", "climax", "ending"],
    tiny: ["opening", "strange", "escalate", "reveal", "ending"],
    extra: ["strange", "strange2", "arrival"],
    long: { first: ["opening", "arrival", "strange"], mids: [["strange2", "strange"], ["strange2", "escalate"]], last: ["reveal", "climax", "ending"] },
    darkAfter: ["escalate", "climax"],
  };

  S.romance = {
    simple: null,
    rich: {
      opening: [
        "{H} had a rule about {P}: expect nothing. It was a good rule, right up until {L} walked in.",
        "It was supposed to be an ordinary evening at {P}. Then {L} laughed at something {H} hadn't meant to be funny, and the evening quietly stopped being ordinary.",
        "Nobody warns you that a whole life can tilt on one ordinary sentence. For {H}, it was {L} at {P}, asking, \"Is this seat taken?\"",
        "{H} had been invisible for so long that being noticed by {L} felt like stepping into warm sunlight after a very long winter.",
        "The first thing {H} noticed about {L} was the voice. The second was that {H} had stopped breathing properly. This was going to be a problem.",
        "{P} had always been the place {H} came to be alone. Then {L} sat down across from {H}, and alone began to sound like a word from another life.",
      ],
      meet: [
        "They kept running into each other. {W}. By the third time, {H} stopped calling it a coincidence.",
        "{L} turned out to be impossible to read and even harder to forget. {A} watched {H} fail to pretend otherwise.",
        "{L} remembered things nobody remembers: how {H} took tea, which song made {H} go quiet, the name of a dog in a story told once, in passing. Being listened to this closely was its own kind of tenderness.",
        "They talked until the lights changed twice, and neither of them mentioned leaving. {W}.",
        "It turned out {L} was afraid of exactly the things {H} was afraid of. They compared lists, laughing, and found the lists matched almost to the line.",
        "{H} told {L} something true, small and unguarded, and waited to be judged. Instead {L} said, \"Me too,\" very quietly, and something in {H} came gently unlocked.",
      ],
      spark: [
        "Something small happened near {P2}: a shared umbrella, a held door, {I} passed from one hand to another. After that, {H} noticed everything.",
        "It was nothing, really. A glance at {P2}, a smile held a second too long. But it was the kind of nothing that keeps a person awake.",
        "Their hands touched reaching for the same thing, and neither pulled away fast enough to call it an accident. The air near {P2} went very still.",
        "{L} tucked a stray strand of hair behind {H}'s ear, then froze, as if surprised by their own hand. \"Sorry,\" {L} said. \"Don't be,\" said {H}, and meant it more than anything said all year.",
        "It was a glance across {P2}, held a heartbeat past polite. After that, every room {H} walked into had one person in it who mattered.",
        "{L} laughed, and {H} thought: I would do almost anything to be the reason for that sound again. It was a frightening thought. It was also, undeniably, wonderful.",
      ],
      closer: [
        "Late that night, with {P2} dark and the world far away, {L} said, \"Tell me something you've never told anyone.\" {H} did. {L} listened as if every word were precious, and did not look away once.",
        "They sat so close that {H} could feel the warmth of {L}'s shoulder, and neither moved an inch. Some distances are chosen, and this one was being chosen by both of them.",
        "{L} took {H}'s hand, slowly, giving every chance to say no. {H} said nothing at all, and laced their fingers together instead. Nobody has ever said so much with so little.",
        "{H} caught {L} watching and did not look away. For one long, trembling moment the whole world narrowed to a pair of eyes and a held breath.",
        "{L} leaned in to hear over the noise, and {H} forgot the question entirely. There was only the nearness, and the quiet thunder of a heart that no longer felt like it belonged to {H} alone.",
        "\"I like who I am when you're around,\" {L} said, as if confessing a crime. {H} could not answer, because the same sentence was already living in {H}'s chest.",
      ],
      obstacle: [
        "Then {V} complicated everything. What had been easy became careful, and what had been honest became half-sentences.",
        "And then {V} got in between them, as if the universe had decided simple was boring.",
        "{V} stepped between them, and the easy warmth thinned into careful politeness. It is astonishing how fast two people can become strangers when each is afraid of being the first to reach.",
        "{V} had a way of turning up exactly when things were soft and fragile. {H} watched {L} pull back, a small step, a smaller smile, and felt the whole evening crack.",
        "Something was said, in the wrong tone, at the wrong moment, and {V} did the rest. By midnight both of them were certain the other had stopped caring, and both of them were wrong.",
        "{H} wanted to say, Stay. Instead {H} said, \"It's fine,\" which is the most dishonest sentence in the language, and {L} heard exactly what it meant and left anyway.",
      ],
      distance: [
        "For a week they barely spoke. {H} told {A} it was fine, which was how {A} knew it wasn't.",
        "The silence stretched. {H} typed three messages and deleted all of them, then walked past {P} twice, on purpose, for no reason.",
        "The days were quieter without {L}, but not peaceful. Every song had a corner where {L} was hiding, and {H} stopped listening to most of them.",
        "{H} drafted a message, and another, and a third. They all said the same thing in different, clumsier words, and none were sent. Pride, it turns out, is heavy to carry and heavier to put down.",
        "At {P}, someone laughed in a way that sounded like {L}. {H} turned too fast, hoping, and the ache of finding a stranger there followed {H} all the way home.",
        "Missing someone isn't loud. It's the cup left out for two, the half-turn at a door, the phone checked once too often. {H} was learning all the quiet shapes of it.",
      ],
      realize: [
        "It was {A2} who said it plainly: \"You're not angry. You're scared.\" {H} stared at the floor, because it was true.",
        "Somewhere between midnight and morning, {H} stopped arguing with the truth. It was {L}. It had always been {L}.",
        "{A} said, very gently, \"You know you're allowed to want this, right?\" {H} opened a mouth to argue, and found there was nothing left to argue with.",
        "It arrived without drama, the way real things do: {H} simply knew. It wasn't a crush, and it wasn't a phase. It was {L}, steady and certain, like a door that had always been there, waiting to be opened.",
        "{H} understood then that being afraid of losing {L} was only another way of saying how much {L} mattered. Fear and love were, it turned out, the same road seen from different sides.",
        "Somewhere in the long hours of the night, {H} stopped making lists of reasons it wouldn't work. The only list left had one line on it, and the line was a name.",
      ],
      gesture: [
        "So {H} went to {P}, and chose to {T}. It was the bravest, most embarrassing thing {H} had ever done.",
        "{H} didn't plan what to say. {H} just went to {P}, took a breath, and decided to {T}.",
        "So {H} went to {P}, heart pounding hard enough to hear, and chose to {T}. Courage, it turns out, mostly looks like shaking hands that keep going.",
        "{H} had rehearsed a speech. It lasted exactly as long as it took to see {L}, and then every word was gone but the true ones. {H} chose to {T}.",
        "There was no grand plan. There was only {H}, standing at {P}, deciding that a lifetime of what-ifs was worse than one honest, terrifying moment. So {H} chose to {T}.",
      ],
      ending: [
        "{L} didn't say anything at first. Then {L} smiled, the slow kind, and took out {I} as if it had been waiting all along. \"I was hoping you'd come,\" {L} said. {M}",
        "{L} laughed, a little breathless, and stepped closer. For once, nobody was thinking about rules. {M}",
        "\"I'm sorry,\" {H} said. \"Don't be,\" said {L}, closing the space between them. \"Just stay.\" And {H} did, hands held, forehead to forehead, two people who had finally stopped pretending. {M}",
        "{L} held {H}'s face as if it were something precious and breakable, and kissed {H} softly, once, like a promise. When they drew apart, both were smiling, a little stunned, and entirely sure. {M}",
        "Neither of them said \"I love you,\" not yet. They didn't need to. It was in the way {L} held on, and the way {H} held back nothing, and the way the whole night seemed to hold its breath for them. {M}",
        "{L} laughed softly against {H}'s shoulder. \"You came,\" {L} said, as if it were a miracle. \"I'd always come,\" {H} answered, and found it was the truest thing ever said. {M}",
      ],
      endingDark: [
        "{L} said nothing at all, which was worse, and better. Whatever came next, neither of them would walk away unmarked. {H} found, to no one's surprise, that they didn't mind.",
        "{L} reached out, and the world narrowed to that one gesture. It would end badly, probably. They both knew it. They took each other's hands anyway.",
        "They kissed like people who had run out of reasons to be careful: slowly at first, then like a confession neither could hold back any longer. Whatever it cost, it was already worth it.",
        "\"This is a terrible idea,\" {L} whispered, a breath away. \"The worst,\" {H} agreed, and closed the distance. Some risks are the only things that make a life feel lived.",
      ],
    },
    seq: ["opening", "meet", "spark", "closer", "obstacle", "distance", "realize", "gesture", "ending"],
    short: ["opening", "spark", "closer", "obstacle", "gesture", "ending"],
    tiny: ["opening", "spark", "obstacle", "gesture", "ending"],
    extra: ["meet", "spark", "closer", "distance"],
    long: { first: ["opening", "meet"], mids: [["spark", "closer"], ["obstacle", "distance"]], last: ["realize", "gesture", "ending"] },
    darkAfter: ["spark", "closer", "obstacle"],
  };
  S.romance.simple = S.romance.rich;

  S.comedy = {
    simple: {
      opening: [
        "{H} had a plan. It was a very good plan, mostly. It had to do with {P} and {I}.",
        "It all began when {H} said, \"Nothing can possibly go wrong at {P}.\" Famous last words.",
      ],
      plan: [
        "{A} read the plan twice. \"It's perfect,\" said {A}. \"Nothing can possibly go wrong.\" (Something went wrong.)",
        "{H} told {A} the plan. {A} laughed so hard that a hiccup came out.",
      ],
      mishap: [
        "First, {W}. {H} tried to stay calm, which was hard.",
        "It started to go wrong at {P2}, where {W}.",
      ],
      mishap2: [
        "Then {V} turned up, which is never a good sign. Everything wobbled.",
        "Next came {V}, with a very silly face and a very silly plan.",
      ],
      chaos: [
        "Soon there was noise everywhere. {A} fell into something sticky. {A2} was on a ladder, for reasons nobody could explain. {H} shouted, and everyone shouted back.",
        "Things flew, bounced and splashed. {A2} got a bucket on the head, and {I} somehow ended up in a tree.",
      ],
      fix: [
        "Then {H} had the silliest idea ever: {T}. It was so silly that it worked.",
        "\"Quick!\" said {H}. \"Everybody {T}!\" And so they did.",
      ],
      ending: [
        "In the end, everyone was laughing, even {V}. {I} was safe, mostly. {M}",
        "{H} looked around at the mess and grinned. Best day ever. {M}",
      ],
    },
    rich: {
      opening: [
        "{H} had a plan. It was, by any reasonable standard, a terrible plan, but it involved {P} and {I}, so there was no going back.",
        "It started with the sentence \"Nothing can possibly go wrong at {P}\", which, as a rule, is the last calm thing anyone says.",
      ],
      plan: [
        "{A} read the plan twice and said, \"This will absolutely not work.\" {H} wrote that down as a vote of confidence.",
        "{H} explained the plan with the help of a diagram. {A} asked a single question, and the diagram quietly fell apart.",
      ],
      mishap: [
        "Things began to unravel at {P2}, where {W}. {H} chose, bravely, to ignore it.",
        "The first thing to go wrong was everything. {W}. {H} smiled in the way people smile at dogs they are not sure about.",
      ],
      mishap2: [
        "And then {V} turned up, because of course {V} did.",
        "At that moment {V} arrived, with a theory, an opinion and the worst possible timing.",
      ],
      chaos: [
        "What followed could not be described as a plan. {A} was somehow holding {I}. {A2} was shouting instructions that contradicted the previous instructions. A pigeon appeared. Nobody asked.",
        "Within minutes the situation had become a sort of dance: someone ran, someone fell, {I} changed hands four times, and {H} kept saying, \"It's fine,\" at an increasing pitch.",
      ],
      fix: [
        "In a rare moment of clarity, {H} realised the solution was to {T}. It was a bad idea, which, in this particular situation, made it perfect.",
        "{H} took a deep breath and decided to {T}. Nobody was more surprised than {H} when it worked.",
      ],
      ending: [
        "By sunrise everyone had agreed never to speak of it again, which lasted about an hour. {H} told the story at every party for years, and each time it got a little better and a little less true. {M}",
        "{H} sat down on the nearest surface, surveyed the wreckage, and began to laugh. {A} joined in, then {A2}, then, reluctantly, {V}. {M}",
      ],
    },
    seq: ["opening", "plan", "mishap", "mishap2", "chaos", "fix", "ending"],
    short: ["opening", "mishap", "mishap2", "fix", "ending"],
    tiny: ["opening", "mishap", "chaos", "fix", "ending"],
    extra: ["mishap", "mishap2", "chaos"],
    long: { first: ["opening", "plan"], mids: [["mishap", "mishap2"], ["chaos", "mishap"]], last: ["fix", "ending"] },
  };

  S.scifi = {
    simple: {
      opening: [
        "Beep, beep! {H} was floating in space, on the way to {P}, when the radio crackled.",
        "{H} pressed the big green button, and the rocket zoomed towards {P}.",
      ],
      signal: [
        "A message arrived: \"Help! We lost {I}!\" {A} read it twice. \"We must help,\" said {H}.",
        "The screen blinked. Someone needed {I}, and only {H} was close enough to help.",
      ],
      journey: [
        "The ship zoomed past {P2}, where {W}. {H} pressed another button.",
        "They flew through {P2}. {W}, and {A} beeped with delight.",
      ],
      discover: [
        "At last, they found {I}, but {V} was already there. \"Mine,\" said {V}, a little rudely.",
        "{I} was floating right in front of them! Unfortunately, so was {V}.",
      ],
      danger: [
        "Alarms went off! The ship wobbled. {A} beeped nervously.",
        "Whoosh! The lights flashed red, and everything went bumpy.",
      ],
      choice: [
        "Then {A2} had an idea. \"Let's {T}!\"",
        "{H} thought for a second. \"I know! We can {T}.\"",
      ],
      resolve: [
        "It worked! {V} laughed and gave {I} back.",
        "Hooray! The ship steadied, and {V} was friendly after all.",
      ],
      ending: [
        "{H} flew home past a million stars. {M}",
        "Back home, {H} looked up at the night sky and waved. {M}",
      ],
    },
    rich: {
      opening: [
        "The alarm woke {H} four hours early. In the small silence that followed, {P} was already on the screen, and the screen was already wrong.",
        "{H} had been on {P} for eleven months when the first message arrived, and it was not meant for anyone.",
      ],
      signal: [
        "The signal repeated: three pulses, a pause, three more. {A} ran the analysis twice. \"It's about {I},\" {A} said, \"or we've misread it.\" Neither option was comforting.",
        "The message was short. {I}, then a location, then a single word: hurry.",
      ],
      journey: [
        "They crossed {P2}, where {W}. {H} kept an eye on the oxygen counter, because it was easier than thinking.",
        "The route took them past {P2}. {W}. Nobody said anything for a long time.",
      ],
      discover: [
        "{I} was where the data said it would be, which should have been a relief. It wasn't. Someone had left it there for them to find.",
        "They found {I} in the last place anyone would look, and with it, the first real evidence that {V} had known they were coming.",
      ],
      danger: [
        "That was when {V} made its move. Doors sealed; lights dimmed; a calm voice announced that everything was under control.",
        "The ship lurched. Somewhere below, something large and mechanical changed its mind about them. {V} had decided.",
      ],
      choice: [
        "{A2} laid out the options. There were two. Both were bad. {H} chose the third: they would {T}.",
        "There was no time to calculate. {H} looked at {A}, and {A} nodded: they would {T}.",
      ],
      resolve: [
        "It shouldn't have worked, and for a moment it didn't. Then the systems came back, one by one, and {V} fell quiet.",
        "The numbers settled. The hum of the ship steadied. {I} was safe in {H}'s hands, and the danger, for now, was behind them.",
      ],
      ending: [
        "Later, with {P} shrinking behind them, {H} looked out at the black and the stars and felt both very small and entirely necessary. {M}",
        "The log entry was three words long. {H} read it twice, then deleted it, then wrote it again. {M}",
      ],
    },
    seq: ["opening", "signal", "journey", "discover", "danger", "choice", "resolve", "ending"],
    short: ["opening", "signal", "danger", "choice", "ending"],
    tiny: ["opening", "signal", "danger", "choice", "ending"],
    extra: ["journey", "danger", "discover"],
    long: { first: ["opening", "signal"], mids: [["journey", "discover"], ["journey", "danger"]], last: ["choice", "resolve", "ending"] },
    darkAfter: ["danger"],
  };

  S.drama = {
    simple: null,
    rich: {
      opening: [
        "{H} had kept the secret for so long that it felt like part of the furniture of {P}.",
        "Nothing about {P} had changed, and that was the strange part. Everything else had.",
      ],
      tension: [
        "Everything held until the day at {P}, when {V} stood in the way, and every polite thing {H} had ever said went quiet.",
        "It began with a small thing, as it always does. Then {V} entered the room, and the small thing grew teeth.",
      ],
      secret: [
        "{A} found {I} and, unlike everyone else, did not look away. \"How long have you known?\" {H} asked. {A} only said: \"Long enough.\"",
        "{I} had been waiting in plain sight. When {A} picked it up, the whole room understood at once.",
      ],
      rupture: [
        "That was when it broke. Words came out that could not be taken back. {A2} left the room, and silence rushed in behind.",
        "Voices rose. Someone said the thing no one was meant to say. For a moment, even the walls seemed to hold their breath.",
      ],
      reckon: [
        "In the quiet that followed, {H} went over it all. Near {P2}, {W}. It wasn't anyone's fault, exactly; it was everyone's, and that was harder.",
        "Hours passed. {H} walked through {P2}, and {W}. Somewhere in the walking, the anger wore thin and the truth showed through.",
      ],
      repair: [
        "So {H} did the hard thing. {H} chose to {T}, and it was awkward, and it was enough.",
        "{H} went back and decided to {T}. It was not a grand gesture. It was a small, honest one, which is rarer.",
      ],
      ending: [
        "Things were not the same after that, but they were better: honest, at least. {H} and {A} sat in {P} until it grew dark, and neither of them left. {M}",
        "In the end, there was no neat resolution, only the slow, brave work of staying. {H} stayed. {M}",
      ],
    },
    seq: ["opening", "tension", "secret", "rupture", "reckon", "repair", "ending"],
    short: ["opening", "tension", "rupture", "repair", "ending"],
    tiny: ["opening", "tension", "rupture", "repair", "ending"],
    extra: ["secret", "reckon", "tension"],
    long: { first: ["opening", "tension"], mids: [["secret", "rupture"], ["reckon", "secret"]], last: ["repair", "ending"] },
  };
  S.drama.simple = S.drama.rich;

  const TITLES = {
    quest: ["{H} and {I}", "The Quest for {I}", "{H} and the Road to {P}"],
    cozy: ["{H} and {I}", "Goodnight, {H}", "{H}'s Little Adventure"],
    mystery: ["The Case of {Ib}", "{H} and the Mystery at {P}", "The Secret of {P}"],
    haunt: ["What Waited at {P}", "{H} and {P}", "The Night at {P}"],
    hauntKid: ["{H} and the Spooky Night", "The Ghost at {P}", "{H} Visits {P}"],
    romance: ["Something About {L}", "{H} and {L}", "The Way {L} Looked at {P}"],
    comedy: ["{H} Has a Plan", "The Great {Ib} Disaster", "Nothing Can Go Wrong at {P}"],
    scifi: ["{H} and {I}", "Signal from {P}", "The Last Light of {P}"],
    drama: ["Quiet at {P}", "{H}, Unspoken", "After {P}"],
  };
  const CH_SIMPLE = ["The Big Idea", "On the Way", "A Little Trouble", "The Brave Part", "Home Again"];
  const CH_RICH = {
    quest: ["The Call", "Into the Unknown", "What Lay Between", "The Turning Point", "After the Storm"],
    mystery: ["The Discovery", "False Trails", "The Twist", "The Truth", "Case Closed"],
    haunt: ["Arrival", "The Wrongness", "What Followed", "The Last Night", "Morning"],
    romance: ["First Sight", "Closer", "The Break", "What Was Said", "Afterwards"],
    comedy: ["The Plan", "Things Go Wrong", "Worse", "The Fix", "Aftermath"],
    scifi: ["The Signal", "The Crossing", "The Trap", "The Choice", "The Quiet After"],
    drama: ["The Secret", "Fault Lines", "Breaking Point", "Reckoning", "Staying"],
    cozy: CH_SIMPLE,
  };

  // ---------- building a story ----------
  // ---------- optional endings ----------
  const ENDINGS = {
    epilogue: {
      simple: [
        "Many days later, {H} still smiled whenever {I} came to mind. {A} smiled too. And that is how it all ended, happily.",
        "A long time after, {H} and {A} sometimes went back to {P}, just to remember. It was always lovely. The end.",
      ],
      rich: [
        "Years later, {H} still told the story of {P}. Some people laughed. {A} never did, because {A} had been there. {I} stayed where it belonged, and nothing was ever quite the same again.",
        "Time passed, as it does. {H} grew, and changed, and kept the memory of {P} close. Some stories end. Others only go quiet, and wait.",
      ],
    },
    twist: {
      simple: [
        "But the biggest surprise came last. Tucked inside {I}, {H} found a tiny note. It said: \"Thank you for being brave. See you soon!\" Who wrote it? Nobody ever knew.",
        "Then came one more surprise. {A} started to giggle, because {A} had known a secret all along. And now {H} knew it too!",
      ],
      rich: [
        "Then, as the others drifted away, {H} noticed what nobody else had. {I} was warm, as if someone had only just let go of it. And in the dust beside it, one fresh footprint pointed back toward {P}.",
        "It was only later that {H} understood. The one detail that did not fit had been there from the very start. Nothing had been an accident. Not a single thing. And somebody was still watching.",
      ],
    },
    cliff: {
      simple: [
        "But just as {H} turned to leave, {P} began to glow, and a tiny voice whispered, \"Come back soon. The adventure has only just begun!\" To be continued...",
      ],
      rich: [
        "Just as {H} thought it was over, a message arrived. No name, only six words: \"It isn't over. Come back to {P}.\" To be continued...",
        "{H} had barely closed the door when the knocking began again. Slow. Patient. Three knocks. To be continued...",
      ],
    },
  };

  const CLEAN = (s, n) => String(s == null ? "" : s).replace(/[<>{}]/g, "").replace(/\s+/g, " ").trim().slice(0, n || 40);

  function setup(params) {
    const r = rng(params.seed);
    const decks = {};
    const draw = (key, list) => {
      if (!list || !list.length) return "";
      let d = decks[key];
      if (!d || !d.length) { d = decks[key] = list.map((_, i) => i); for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; } }
      return list[d.pop()];
    };
    const pickIdx = (n) => Math.floor(r() * n);
    return { r, draw, pickIdx };
  }

  function makeCtx(params, g, lex, rt) {
    const chars = (params.chars || []).map((c) => ({ name: upFirst(CLEAN(c.name, 24)), role: c.role || "friend" })).filter((c) => c.name);
    if (!chars.length) chars.push({ name: params.tier === "tiny" ? "Little Star" : "Alex", role: "hero" });
    let hi = chars.findIndex((c) => c.role === "hero"); if (hi < 0) hi = 0;
    const hero = chars[hi];
    const rest = chars.filter((_, i) => i !== hi);
    const villains = rest.filter((c) => c.role === "villain");
    const allies = rest.filter((c) => c.role !== "villain");
    const ctx = { H: hero.name };
    // romance: first ally is the love interest
    if (g.shape === "romance") {
      const li = allies.shift();
      ctx.L = li ? li.name : rt.draw("names", NAMES.filter((n) => n !== hero.name));
    }
    ctx.A = allies.length ? allies.shift().name : rt.draw("A", lex.A);
    ctx.hasA2 = allies.length > 0;
    ctx.A2 = allies.length ? allies.shift().name : rt.draw("A", lex.A);
    if (ctx.A2 === ctx.A) ctx.A2 = rt.draw("A", lex.A);
    ctx.V = villains.length ? villains.shift().name : rt.draw("V", lex.V);
    ctx.P = params.place ? withThe(CLEAN(params.place, 40)) : rt.draw("P", lex.P);
    ctx.I = params.item ? withThe(CLEAN(params.item, 40)) : rt.draw("I", lex.I);
    ctx.extras = allies.map((c) => ({ name: c.name, villain: false })).concat(villains.map((c) => ({ name: c.name, villain: true })));
    return ctx;
  }

  function fill(text, ctx, lex, rt, g) {
    return text.replace(/\{(\w+)\}/g, (m, k) => {
      if (k === "Ib") return bare(ctx.I);
      if (ctx[k] != null) return ctx[k];
      if (k === "M") return lex.M && lex.M.length ? rt.draw("M" + g, lex.M) : "";
      if (["P2", "W", "T", "C", "S", "D"].includes(k)) return rt.draw(k + g, lex[k]) || "";
      throw new Error("Unknown token " + m);
    });
  }


  // ---------- reading level: swaps words for easier or richer ones (same story, different vocabulary) ----------
  const LEVEL_UP = { big: "enormous", huge: "colossal", happy: "delighted", sad: "sorrowful", scared: "frightened", tired: "weary", angry: "furious", strange: "peculiar", pretty: "lovely", shiny: "gleaming", quiet: "hushed", brave: "courageous", clever: "resourceful", funny: "hilarious", fast: "swift", quickly: "swiftly", shouted: "exclaimed", looked: "gazed", found: "discovered", tried: "attempted", dark: "shadowy", old: "weathered", nice: "pleasant", smart: "astute", noise: "racket", afraid: "apprehensive" };
  const LEVEL_DOWN = { extraordinary: "amazing", enormous: "huge", colossal: "huge", tremendous: "huge", delighted: "happy", exhausted: "tired", furious: "very angry", terrified: "very scared", frightened: "scared", mysterious: "strange", magnificent: "wonderful", ancient: "very old", whispered: "said softly", murmured: "said softly", hesitated: "waited", peculiar: "odd", immediately: "right away", discovered: "found", determined: "sure", courageous: "brave", sorrowful: "sad", gleaming: "shiny", resourceful: "clever", hilarious: "funny", swift: "fast", swiftly: "quickly", exclaimed: "said", gazed: "looked", attempted: "tried", shadowy: "dark", weathered: "old", astute: "smart", apprehensive: "afraid", unexpectedly: "suddenly", surprising: "unexpected", wonderful: "great", incredible: "amazing", marvellous: "great", marvelous: "great", curious: "keen", fortunate: "lucky", reluctantly: "slowly", gradually: "slowly", enormously: "very", seized: "grabbed", peered: "looked", clutched: "held", glanced: "looked", wandered: "walked", gasped: "said" };
  // extra easy-word swaps (teens and grown-ups: "simpler words" should really be simple)
  Object.assign(LEVEL_DOWN, {"unease": "worry", "uneasy": "worried", "deliberate": "careful", "deliberately": "on purpose", "flickered": "flashed", "surfaced": "came back", "accidental": "unplanned", "unbidden": "uninvited", "gratitude": "thanks", "underneath": "under", "caretaker": "keeper", "evidence": "proof", "sheltered": "kept safe", "disaster": "mess", "battered": "worn", "director": "boss", "occurred": "happened", "appeared": "showed up", "fiercely": "strongly", "cliffside": "cliff", "muttered": "mumbled", "recognise": "know", "divided": "split", "strangely": "oddly", "pretending": "acting", "opinion": "view", "convincing": "believable", "thickened": "grew thick", "slackened": "eased", "narrowed": "shrank", "certainty": "being sure", "staircase": "stairs", "mattered": "counted", "expectant": "hopeful", "belonged": "fit", "polished": "shiny", "softening": "getting softer", "direction": "way", "metallic": "metal", "unmistakably": "clearly", "rummaged": "searched", "reflection": "image", "wonderfully": "very well", "tentatively": "shyly", "inspection": "check", "apartment": "flat", "conversation": "talk", "barely": "hardly", "suggested": "said", "travelled": "went", "brilliant": "great", "confidence": "courage", "argument": "fight", "announced": "said", "quality": "kind", "impossible": "not possible", "otherwise": "or else", "skittered": "ran", "uneven": "bumpy", "deliver": "bring", "instantly": "at once", "shimmered": "glowed", "property": "place", "several": "a few", "glittered": "sparkled", "movement": "move", "clarity": "clearness", "supposed": "meant", "handwriting": "writing", "comforting": "warm", "mentioned": "said", "rehearsing": "practising", "rehearsed": "practised", "observed": "saw", "ridiculous": "silly", "unravel": "come apart", "generation": "age", "forbidden": "not allowed", "corrected": "fixed", "footsteps": "steps", "particular": "certain", "believing": "thinking", "photographed": "snapped", "scrambled": "hurried", "collapsed": "fell", "mechanical": "machine-like", "crouching": "bending low", "possibly": "maybe", "exchanged": "traded", "straightened": "stood straight", "evenly": "steadily", "signature": "name", "muttering": "mumbling", "outwitted": "tricked", "strangest": "oddest", "gathered": "picked up", "grumbling": "complaining", "rearranged": "moved around", "broadcast": "message", "explaining": "telling", "situation": "problem", "intelligence": "smarts", "unkindly": "meanly", "timeline": "plan", "arrival": "coming", "expression": "look", "photograph": "picture", "invisible": "unseen", "universe": "world", "accuracy": "care", "reflected": "showed", "information": "facts", "convenient": "handy", "instructions": "steps", "competitive": "eager", "analysis": "study", "encrypted": "locked", "politely": "kindly", "entirely": "fully", "disappointing": "sad", "disappears": "vanishes", "silently": "quietly", "preferably": "best", "transmitting": "sending", "commander": "leader", "occupied": "busy", "reasonable": "fair", "discarding": "throwing away", "produced": "made", "recently": "lately", "memorised": "learned by heart", "discovering": "finding", "completely": "fully", "confident": "sure", "statement": "words", "percentage": "share", "existed": "was", "heavily": "deeply", "overheard": "heard", "involved": "part", "differently": "another way", "unmarked": "clean", "complicated": "tricky", "optimistic": "hopeful", "discovery": "find", "wrongness": "wrong feeling", "corrupted": "broken", "underfoot": "below", "intended": "meant", "unspoken": "unsaid", "coincidence": "chance", "edited": "changed", "necessary": "needed", "misunderstanding": "mix-up", "humiliating": "awful", "unusual": "odd", "diagnostics": "checks", "adjusted": "changed", "perfectly": "just", "grateful": "thankful", "arranged": "set up", "frightens": "scares", "pocketed": "tucked away", "disappointed": "let down", "unpacked": "took out", "intruder": "stranger", "dignity": "pride", "murmuring": "mumbling", "conveniently": "handily", "respectable": "decent", "fascinating": "very interesting", "consider": "think about", "altered": "changed", "solution": "answer", "resisting": "fighting", "careless": "not careful", "recalibrated": "reset", "insisting": "saying firmly", "suspected": "guessed", "catalogued": "listed", "applauded": "clapped", "ironically": "oddly", "gravely": "seriously", "unfamiliar": "new", "colourful": "bright", "graceful": "smooth", "manuscript": "pages", "preferred": "liked better", "unmistakable": "clear", "traditional": "old", "inadvisable": "unwise", "location": "place", "avoided": "dodged", "professionalism": "skill", "unnatural": "odd", "reality": "real life", "unwelcome": "unwanted", "increasing": "growing", "described": "told", "aftermath": "after", "adopted": "took on", "vibrating": "shaking", "practical": "sensible", "embarrassment": "shame", "arithmetic": "maths", "calculate": "work out", "announces": "says", "lingered": "stayed", "unbearable": "too much", "unison": "together", "precisely": "exactly", "distrusted": "doubted", "merely": "only", "suggestion": "idea", "discourage": "put off", "resolution": "decision", "unreasonable": "unfair", "identical": "the same", "defeated": "beaten", "amounted": "added up", "rational": "sensible", "explanations": "reasons", "reversed": "turned around", "plausible": "believable", "explanation": "reason", "deduction": "guess", "assumption": "guess", "rearrange": "move around", "stillness": "quiet", "ambitious": "driven", "unnoticed": "unseen", "considered": "thought about", "reluctantly": "unwillingly", "editing": "changing", "improving": "getting better", "processed": "handled", "compliant": "obedient", "disagreed": "argued", "properly": "right", "mischievous": "playful", "irrational": "silly", "cooperation": "teamwork", "colleague": "co-worker", "commitment": "promise", "unafraid": "not afraid", "witnesses": "people who saw", "mismatched": "odd", "specific": "exact", "physical": "body", "remained": "stayed", "accusation": "blame", "disturbed": "upset", "admitting": "owning up", "grudgingly": "unwillingly", "absolutely": "totally", "overkill": "too much", "machinery": "machines", "protecting": "guarding", "refusing": "saying no", "approached": "neared", "approaching": "nearing", "exhaling": "breathing out", "automated": "automatic", "announcement": "news", "impressive": "great", "adulthood": "grown-up life", "scattered": "spread", "horrified": "shocked", "intention": "plan", "attraction": "pull", "defending": "guarding", "absurdly": "wildly", "absurd": "silly", "unexpectedly": "out of nowhere", "triggered": "set off", "expectation": "hope", "however": "but", "punctuated": "broken", "occasional": "now and then", "conditioning": "training", "remaining": "left", "unguarded": "open", "unimportant": "small", "rewritten": "changed", "designed": "made", "luxury": "comfort", "loyalties": "loyalty", "employers": "bosses", "directly": "straight", "suspicious": "doubtful", "unworthy": "not good enough", "agreeable": "pleasant", "atmosphere": "mood", "excellent": "great", "animated": "lively", "hovering": "floating", "concerned": "worried", "accounted": "explained", "repaired": "fixed", "grievance": "complaint", "frightening": "scary", "absolute": "total", "algorithm": "rule", "tightening": "getting tight", "unanswered": "left open", "fluorescent": "bright", "complexion": "skin", "enormously": "hugely", "structure": "shape", "cherished": "loved", "softened": "got soft", "insisted": "said firmly", "helplessly": "with no way out", "opinions": "views", "unquestioning": "trusting", "marginally": "slightly", "functioning": "working", "apologise": "say sorry", "unforgiving": "hard", "unexpected": "surprising", "untouched": "left alone", "forgivable": "okay", "confidante": "close friend", "cynical": "doubtful", "overly": "too", "loosened": "relaxed", "refused": "said no", "curiosity": "interest", "landscape": "view", "abandoned": "empty", "realised": "saw", "steadying": "calming", "tiredness": "being tired", "corporate": "office", "footprints": "prints", "dismayed": "upset", "rehearse": "practise", "tentative": "shy", "wistful": "sad", "sombre": "sad", "brooding": "moody", "reluctant": "unwilling", "relentless": "nonstop", "fleeting": "brief", "vulnerable": "open", "vulnerability": "openness", "yearning": "longing", "tenderness": "care", "bewildered": "confused", "exasperated": "fed up", "apprehension": "fear", "anticipation": "hope", "trembling": "shaking", "unravelling": "coming apart", "composure": "calm", "acknowledged": "admitted", "contemplated": "thought about", "resolve": "courage", "dread": "fear", "longing": "wish", "poised": "ready", "faltered": "stumbled", "wavered": "wobbled", "smouldering": "burning", "lingering": "staying", "enveloped": "wrapped", "scarcely": "hardly", "uncertain": "unsure", "uncertainty": "doubt", "exquisite": "lovely", "delicate": "gentle", "luminous": "glowing", "tranquil": "calm", "solemn": "serious", "sincere": "true", "sincerity": "honesty"});
  const LEVELS = { simple: LEVEL_DOWN, advanced: LEVEL_UP };
  const aOrAn = (w) => (/^[aeiou]/i.test(w) ? "an" : "a");
  function levelize(text, level) {
    const map = LEVELS[level];
    if (!map) return text;
    const keys = Object.keys(map).sort((a, b) => b.length - a.length);
    const re = new RegExp("\\b(?:(an?)\\s+)?(" + keys.join("|") + ")\\b", "gi");
    return String(text).replace(re, (m, art, w, off, whole) => {
      const rep = map[w.toLowerCase()];
      const cap = w[0] !== w[0].toLowerCase();
      if (cap) {
        // a capital letter mid-sentence is probably a name, leave it alone
        const before = whole.slice(0, off).replace(/[\s"“'‘(]+$/, "");
        if (before && !/[.!?:]$/.test(before)) return m;
      }
      // "whispered a plan" cannot become "said softly a plan": only swap these when nothing is whispered directly
      if ((w.toLowerCase() === "whispered" || w.toLowerCase() === "murmured") && !/^\s*(?:[.,!?;:"\u201d]|$|to\b|that\b|with\b|and\b|as\b|in\b|into\b|back\b)/.test(whole.slice(off + m.length))) return m;
      const out = cap ? rep[0].toUpperCase() + rep.slice(1) : rep;
      if (!art) return out;
      const a = aOrAn(out);
      return (art[0] === "A" ? a[0].toUpperCase() + a.slice(1) : a) + " " + out;
    });
  }


  // "simpler words" for teens and grown-ups: shorter sentences on top of the easy-word swaps
  function easify(text) {
    const parts = String(text).split(/(["\u201c\u201d])/);
    let inQ = false;
    const up = (c) => c.toUpperCase();
    return parts.map((seg) => {
      if (/^["\u201c\u201d]$/.test(seg)) { inQ = !inQ; return seg; }
      if (inQ) return seg;
      seg = seg.replace(/;\s+([a-z])/g, (m, c) => ". " + up(c));
      seg = seg.replace(/:\s+([a-z])/g, (m, c) => ". " + up(c));
      seg = seg.replace(/([^.!?]{70,}?), (and|but|so|yet) (?=(?:the|a|an|it|they|we|i|you|he|she|everyone|nobody|nothing|something|[A-Z][a-z]+)\b)/g, (m, a, w) => a + ". " + w[0].toUpperCase() + w.slice(1) + " ");
      return seg;
    }).join("");
  }
  const simplify = (text, level, tier) => {
    const t = levelize(text, level);
    return level === "simple" && (tier === "teens" || tier === "adult") ? easify(t) : t;
  };

  // how hard a line is to read: longest sentence (after splitting) plus long, unswapped words
  const syl3 = (w) => { w = w.toLowerCase().replace(/[^a-z]/g, ""); if (w.length <= 3) return 1; w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, ""); const m = w.match(/[aeiouy]{1,2}/g); return m ? m.length : 1; };
  function easyScore(line) {
    const t = easify(line.replace(/\{\w+\}/g, "Aanya"));
    const sents = t.match(/[^.!?]+[.!?]+/g) || [t];
    const longest = Math.max(...sents.map((x) => (x.match(/[A-Za-z']+/g) || []).length));
    const words = t.toLowerCase().match(/[a-z']+/g) || [];
    const hard = words.filter((w) => syl3(w) >= 4 && !LEVEL_DOWN[w]).length;
    return longest + 4 * hard;
  }
  // keep the easier lines of a pool (at least 4, or the easiest ~70%)
  function easierOf(arr) {
    if (!Array.isArray(arr) || arr.length < 6) return arr;
    const scored = arr.map((l, i) => ({ l, i, s: easyScore(l) })).sort((a, b) => a.s - b.s || a.i - b.i);
    const keep = Math.max(4, Math.ceil(arr.length * 0.7));
    const ok = new Set(scored.slice(0, keep).map((x) => x.i));
    return arr.filter((_, i) => ok.has(i));
  }
  function easierPool(pool) {
    const out = {};
    for (const [k, v] of Object.entries(pool)) out[k] = easierOf(v);
    return out;
  }

  // ---------- length: stories are woven out to about 450 / 1300 / 2000 words ----------
  const WORD_TARGET = { short: 450, medium: 1300, long: 2000 };
  const countWords = (t) => (String(t).match(/\S+/g) || []).length;
  const PATTERNS = [
    ["setting", "action", "talk", "feeling"],
    ["action", "talk", "setting", "trouble"],
    ["trouble", "feeling", "action", "talk"],
    ["talk", "trouble", "action", "feeling"],
    ["trouble", "action", "talk", "hope"],
    ["hope", "feeling", "talk", "action"],
  ];
  // a beat that comes round twice must not repeat the same sentence: keep the first, drop later copies
  function dedupeSentences(chapters, tailCount) {
    const seen = new Set(); let total = chapters.reduce((n, c) => n + c.paragraphs.length, 0), gi = 0;
    chapters.forEach((c) => { c.paragraphs = c.paragraphs.map((p) => {
      const inTail = gi++ >= total - tailCount;
      const parts = p.match(/[^.!?]+[.!?]+["”]?\s*/g);
      if (!parts || parts.join("").length < p.length - 2) return p;       // unusual text: leave alone
      const keep = parts.filter((x) => { const k = x.trim().toLowerCase(); if (k.length < 25) return true; if (seen.has(k)) return false; seen.add(k); return true; });
      return keep.length ? keep.join("").trim() : (inTail ? p : "");
    }).filter(Boolean); });
    chapters.forEach((c) => { if (!c.paragraphs.length) c.paragraphs.push(""); });
  }

  function expandStory(chapters, tailCount, target, tier, shapeName, reg, ctx, lex, rt, gid, easyMode) {
    const X = (EXP && EXP[shapeName]) || {}, G = shapeName === "romance" ? {} : ((EXP && EXP.generic) || {});   // romance keeps to its own love-story lines (generic ones are about quests and maps)
    const pickReg = (o) => (o && (o[reg] || (reg === "simple" ? o.rich : o.simple))) || null;
    const XS = pickReg(X), GS = pickReg(G);
    if (!XS && !GS) return;
    const usable = (u) => {
      for (const m of u.matchAll(/\{(\w+)\}/g)) {
        const k = m[1];
        if (["P2", "W", "T"].includes(k) && !(lex[k] && lex[k].length)) return false;
        if (k === "L" && !ctx.L) return false;
        if (k === "A2" && !ctx.hasA2) return false;   // do not bring in a character the reader never asked for
      }
      return true;
    };
    const decks = {}, CATS = ["setting", "action", "talk", "feeling", "trouble", "hope"];
    const refill = (cat) => {
      let d = [].concat((XS && XS[cat]) || [], (GS && GS[cat]) || []).filter(usable);
      if (easyMode) d = easierOf(d);
      for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(rt.r() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
      return (decks[cat] = d);
    };
    CATS.forEach(refill);
    // never repeat a line inside one story: when a category runs dry, borrow from the fullest one; reshuffle only when all are empty
    const nextUnit = (cat) => {
      if (!decks[cat].length) {
        const richest = CATS.slice().sort((a, b) => decks[b].length - decks[a].length)[0];
        if (decks[richest].length) cat = richest; else { CATS.forEach(refill); }
      }
      return decks[cat].pop() || "";
    };
    const makeUnit = (cat) => { const u = nextUnit(cat); return u ? tidy(fill(u, ctx, lex, rt, gid)) : ""; };

    const all = chapters.reduce((n, c) => n + c.paragraphs.length, 0);
    const lastSlot = all - tailCount - 1;               // we never insert inside the closing paragraphs
    if (lastSlot < 0) return;
    const slots = [];                                    // a slot sits after existing paragraph #i (global index)
    let gi = 0;
    chapters.forEach((c, ci) => c.paragraphs.forEach((p, pi) => { if (gi <= lastSlot) slots.push({ ci, pi, gi, add: [] }); gi++; }));
    const total0 = chapters.reduce((n, c) => n + countWords(c.paragraphs.join(" ")), 0);
    let need = target - total0;
    if (need <= 0) return;
    const weights = slots.map((s, i) => 0.55 + Math.sin(Math.PI * (i + 0.5) / slots.length));
    const wsum = weights.reduce((a, b) => a + b, 0);
    const perPara = tier === "tiny" ? [2, 3] : [3, 5];
    let added = 0, guard = 0;
    const pat = () => PATTERNS[Math.floor(rt.r() * PATTERNS.length)];
    slots.forEach((s, i) => {
      const quota = Math.round(need * weights[i] / wsum);
      let got = 0;
      while (got < quota && guard++ < 4000) {
        const prog = (i + 0.5) / slots.length;
        // early paragraphs open scenes, late ones resolve them
        const cats = prog < 0.2 ? PATTERNS[0] : prog > 0.8 ? PATTERNS[5] : pat();
        const n = perPara[0] + Math.floor(rt.r() * (perPara[1] - perPara[0] + 1));
        const units = [];
        for (let k = 0; k < n && k < cats.length; k++) { const u = makeUnit(cats[k]); if (u) units.push(u); }
        const para = units.join(" ");
        if (!para) break;
        s.add.push(para); got += countWords(para); added += countWords(para);
      }
    });
    // top up or trim so the total lands within a few words of the target
    const midSlot = slots[Math.floor(slots.length / 2)];
    let spin = 0;
    while (target - (total0 + added) > 12 && spin++ < 200) {
      const cats = pat(); const units = cats.slice(0, 3).map(makeUnit).filter(Boolean); if (!units.length) break;
      const para = units.join(" "); midSlot.add.push(para); added += countWords(para);
    }
    spin = 0;
    while (total0 + added - target > 12 && spin++ < 200) {
      // drop the last sentence of the longest added paragraph that stays tidy (never leave a quote open), else drop a whole paragraph
      const cands = [];
      slots.forEach((s) => s.add.forEach((p, k) => cands.push({ s, k, p })));
      if (!cands.length) break;
      cands.sort((x, y) => countWords(y.p) - countWords(x.p));
      let done = false;
      for (const c of cands) {
        const sentences = c.p.match(/[^.!?]+[.!?]["”]?\s*/g) || [c.p];
        if (sentences.length < 2) continue;
        sentences.pop(); const np = sentences.join("").trim();
        if ((np.match(/["“”]/g) || []).length % 2) continue;
        added -= countWords(c.p) - countWords(np); c.s.add[c.k] = np; done = true; break;
      }
      if (!done) { const c = cands[cands.length - 1]; c.s.add.splice(c.k, 1); added -= countWords(c.p); }
    }
    // insert from the back so earlier indexes stay valid
    for (let i = slots.length - 1; i >= 0; i--) { const s = slots[i]; if (s.add.length) chapters[s.ci].paragraphs.splice(s.pi + 1, 0, ...s.add); }
  }

  function generate(params) {
    const tier = TIERS[params.tier] ? params.tier : "kids";
    const gid = GENRES[params.genre] && GENRES[params.genre].tiers.includes(tier) ? params.genre : Object.keys(GENRES).find((k) => GENRES[k].tiers.includes(tier));
    const g = GENRES[gid];
    const lex = LEX[g.lex];
    const shape = S[g.shape];
    const reg = tier === "tiny" || tier === "kids" ? "simple" : "rich";
    const easyOn = params.level === "simple" && (tier === "teens" || tier === "adult");
    let pool = shape[reg] || shape.rich;
    if (easyOn) pool = easierPool(pool);
    const length = D.LENGTHS[params.length] ? params.length : "medium";
    const seed = (params.seed == null ? Math.floor(Math.random() * 2 ** 31) : params.seed) >>> 0;
    const rt = setup({ seed });
    const ctx = makeCtx({ ...params, tier }, g, lex, rt);
    const dark = (tier === "adult") && lex.D && lex.D.length > 0;

    const beatText = (name, state) => {
      const variants = (name === "ending" && gid === "darkromance" && pool.endingDark) ? pool.endingDark : pool[name];
      if (!variants) return "";
      const t = rt.draw("beat:" + g.shape + ":" + name + (name === "ending" && gid === "darkromance" ? "D" : ""), variants);
      let out = fill(t, ctx, lex, rt, gid);
      if (dark && shape.darkAfter && shape.darkAfter.includes(name)) out += " " + fill("{D}", ctx, lex, rt, gid);
      return out;
    };
    const makeParas = (beats) => {
      const texts = beats.map((b) => tidy(beatText(b)));
      if (tier === "tiny") return texts;
      const paras = [];
      for (let i = 0; i < texts.length; i += 2) paras.push(texts.slice(i, i + 2).join(" "));
      return paras;
    };
    const cameo = (paras) => {
      if (!ctx.extras.length) return;
      const where = Math.max(1, Math.floor(paras.length / 2));
      const lines = ctx.extras.map((x) => tidy(x.villain
        ? `${x.name} lurked in the background, and made everything a little harder.`
        : (tier === "tiny" ? `${x.name} came along too, and waved hello.` : `Along the way, ${x.name} joined in, with a surprising talent for exactly what was needed.`)));
      paras.splice(where, 0, lines.join(" "));
    };

    let chapters;
    const chTitles = (CH_RICH[g.shape] || CH_RICH.quest);
    if (length === "long") {
      const n = tier === "tiny" ? 2 : tier === "kids" ? 3 : 4;
      const L = shape.long;
      const X = shape.extra || [];
      const ex = (i) => X[i % X.length];
      const plan0 = n === 2 ? [L.first, L.mids[0].concat(L.last)] : n === 3 ? [L.first, L.mids[0], L.last] : [L.first, L.mids[0], L.mids[1] || L.mids[0], L.last];
      // pad each chapter with extra beats so long stories feel long
      const plan = plan0.map((b, i) => (i === 0 ? b.concat([ex(0)]) : i === plan0.length - 1 ? [ex(i)].concat(b) : b.concat([ex(i), ex(i + 1)])).filter((x) => pool[x]));
      chapters = plan.map((beats, i) => ({ title: (reg === "simple" ? CH_SIMPLE : chTitles)[Math.min(i === plan.length - 1 ? 4 : i, 4)] || "Chapter " + (i + 1), paragraphs: makeParas(beats) }));
      cameo(chapters[Math.min(1, chapters.length - 1)].paragraphs);
    } else {
      let beats = length === "short" ? shape.short : tier === "tiny" ? shape.tiny : shape.seq;
      if (length === "medium" && reg === "simple") {
        // simple-register beats are short, so add a couple of extra beats to make "medium" feel different from "short"
        const X = (shape.extra || []).filter((x) => pool[x]);
        beats = beats.slice();
        if (X.length) { beats.splice(2, 0, X[0]); if (tier !== "tiny") beats.splice(beats.length - 2, 0, X[1 % X.length]); }
      }
      const paras = makeParas(beats);
      cameo(paras);
      chapters = [{ title: "", paragraphs: paras }];
    }
    // make sure every character the reader typed shows up, whatever the story shape used
    const allNames = (params.chars || []).map((c) => upFirst(CLEAN(c.name, 24))).filter(Boolean);
    const flat = () => chapters.map((c) => c.paragraphs.join(" ")).join(" ");
    const lost = allNames.filter((n) => !flat().includes(n));
    if (lost.length) {
      const target = chapters[Math.min(1, chapters.length - 1)].paragraphs;
      const villainNames = (params.chars || []).filter((c) => c.role === "villain").map((c) => upFirst(CLEAN(c.name, 24)));
      const line = lost.map((n) => tidy(villainNames.includes(n)
        ? `${n} lurked in the background, and made everything a little harder.`
        : (tier === "tiny" ? `${n} came along too, and waved hello.` : `Along the way, ${n} joined in, with a surprising talent for exactly what was needed.`))).join(" ");
      target.splice(Math.max(1, Math.floor(target.length / 2)), 0, line);
    }
    // chosen ending: a twist, an epilogue ("years later") or a cliffhanger. Never mixed into bedtime stories.
    const endKind = ["twist", "epilogue", "cliff"].includes(params.ending) && !(params.bedtime && (tier === "tiny" || tier === "kids")) && !(params.ending === "cliff" && tier === "tiny") ? params.ending : "";
    if (endKind) {
      const E2 = ENDINGS[endKind][reg === "simple" ? "simple" : "rich"];
      const lastP = chapters[chapters.length - 1].paragraphs;
      lastP.push(tidy(fill(E2[Math.floor(rt.r() * E2.length)], ctx, lex, rt, gid)));
    }
    // bedtime mode: a gentle look back at the day, then a slow wind-down for sleep
    const bed = params.bedtime && (tier === "tiny" || tier === "kids") ? { today: CLEAN(params.bedtime.today, 60).replace(/[.!?]+$/, "") } : null;
    if (bed) {
      const last = chapters[chapters.length - 1].paragraphs;
      const H = ctx.H;
      if (bed.today) last.push(`Today had been a big day for ${H}: ${bed.today}. Some days feel big, and that is okay.`);
      const wind = [
        `Now the story was nearly over, and everything grew soft and slow. ${H} took a deep breath in... and a long breath out. In... and out.`,
        `The night was quiet now. The stars blinked slowly, one by one. ${H} felt warm and safe, with heavy eyelids and a calm, cosy tummy.`,
        `Everything in the story began to rest. The wind stopped to listen. ${H} snuggled down, and every worry floated away like a little cloud.`,
      ];
      last.push(wind[Math.floor(rt.r() * wind.length)]);
      last.push(allNames.length ? allNames.map((n) => `Goodnight, ${n}.`).join(" ") + " Sleep tight." : "Goodnight. Sleep tight.");
    }
    {
      const tail = 1 + (endKind ? 1 : 0) + (bed ? (bed.today ? 1 : 0) + 1 : 0);
      dedupeSentences(chapters, tail);
      expandStory(chapters, tail, WORD_TARGET[length], tier, g.shape, reg, ctx, lex, rt, gid, easyOn);
    }
    const level = LEVELS[params.level] ? params.level : "";
    if (level) chapters.forEach((c) => { c.paragraphs = c.paragraphs.map((x) => simplify(x, level, tier)); });
    const titleKey = g.shape === "haunt" && reg === "simple" ? "hauntKid" : g.shape;
    const title = titleCase(tidy(fill(rt.draw("title", TITLES[titleKey] || TITLES.quest), ctx, lex, rt, gid)));
    const story = { title, chapters, params: { tier, genre: gid, length, chars: params.chars, place: params.place || "", item: params.item || "", seed, bedtime: bed ? { today: bed.today } : null, ending: endKind, level, dedication: String(params.dedication || "").slice(0, 40) }, ctx: { ...ctx } };
    story.text = toText(story);
    return story;
  }

  // add one more chapter to an existing story
  function continueStory(story) {
    const p = story.params;
    const g = GENRES[p.genre], lex = LEX[g.lex], shape = S[g.shape];
    const tier = p.tier;
    const reg = tier === "tiny" || tier === "kids" ? "simple" : "rich";
    const pool = shape[reg] || shape.rich;
    const rt = setup({ seed: (p.seed + 7919 * (story.chapters.length + 1)) >>> 0 });
    const ctx = { ...story.ctx };
    const mids = shape.long.mids.reduce((a, b) => a.concat(b), []);
    const beats = [mids[Math.floor(rt.r() * mids.length)], mids[Math.floor(rt.r() * mids.length)], "ending"]
      .filter((b, i, a) => pool[b] && a.indexOf(b) === i);
    const texts = beats.map((b) => simplify(tidy(fill(rt.draw("c:" + b, pool[b]), ctx, lex, rt, p.genre)), p.level, tier));
    const paras = tier === "tiny" ? texts : (() => { const o = []; for (let i = 0; i < texts.length; i += 2) o.push(texts.slice(i, i + 2).join(" ")); return o; })();
    const n = story.chapters.length + 1;
    const chapters = story.chapters.length === 1 && !story.chapters[0].title ? [{ title: "Chapter 1", paragraphs: story.chapters[0].paragraphs }] : story.chapters.slice();
    chapters.push({ title: "Chapter " + n, paragraphs: paras });
    const next = { ...story, chapters };
    next.text = toText(next);
    return next;
  }

  // a new episode for the same cast: same characters, new adventure, with a short "last time" line
  function nextEpisode(prev, opts) {
    opts = opts || {};
    const p = prev.params;
    const order = ["tiny", "kids", "teens", "adult"];
    let tier = p.tier;
    if (opts.grow && order.indexOf(tier) < order.length - 1) tier = order[order.indexOf(tier) + 1];
    const s = generate({ tier, genre: p.genre, length: p.length === "short" ? "medium" : p.length, chars: p.chars, place: p.place, item: "", bedtime: tier === "tiny" || tier === "kids" ? p.bedtime : null, ending: "", seed: (p.seed * 31 + 17 + (prev.episode || 1) * 101) >>> 0, level: p.level });
    const ep = (prev.episode || 1) + 1;
    const seriesTitle = prev.seriesTitle || prev.title;
    const recap = tier === "tiny" ? `Last time, in "${seriesTitle}", everything ended happily. Now a new adventure was about to begin.`
      : tier === "adult" ? `After "${seriesTitle}", nothing was quite the same. And then something new began.`
      : `Last time, in "${seriesTitle}", the adventure ended well. But a new one was just starting.`;
    s.chapters[0].paragraphs.unshift(recap);
    s.episode = ep; s.seriesTitle = seriesTitle; s.seriesId = prev.seriesId || prev.id || String(p.seed);
    s.title = `${seriesTitle}: Episode ${ep}`;
    s.text = toText(s);
    return s;
  }

  function toText(s) {
    return [s.title].concat(s.chapters.map((c) => (c.title ? c.title + "\n\n" : "") + c.paragraphs.join("\n\n"))).join("\n\n");
  }

  function genresFor(tier) {
    return Object.keys(GENRES).filter((k) => GENRES[k].tiers.includes(tier)).map((k) => ({ id: k, ...GENRES[k] }));
  }

  return { levelize, generate, continueStory, nextEpisode, genresFor, toText, tidy, _S: S };
});
