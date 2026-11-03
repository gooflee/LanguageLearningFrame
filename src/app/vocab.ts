// ESP32-friendly compact vocabulary store (see docs/scene-guide.md "Small frames"):
// Stored as newline + pipe-delimited strings:
// "wordLatin|wordNative|reading|pos|meaning|exampleLatin|exampleNative|translation|level"
// By keeping both Latin/Romaji and Native CJK representations, the scene renders 100%
// legibly out-of-the-box with FrameOS's built-in Ubuntu font (which lacks CJK glyphs),
// while also supporting native Kanji/Kana/Hangul when a CJK font is uploaded to FrameOS.

export interface VocabCard {
  word: string;
  reading: string;
  pos: string;
  meaning: string;
  example: string;
  translation: string;
  level: string;
  index: number;
  total: number;
  languageLabel: string;
}

const LANGUAGE_LABELS_LATIN: Record<string, string> = {
  ja: "Japanese (Nihongo)",
  es: "Spanish (Español)",
  fr: "French (Français)",
  de: "German (Deutsch)",
  ko: "Korean (Hangugo)",
};

const LANGUAGE_LABELS_NATIVE: Record<string, string> = {
  ja: "Japanese • 日本語",
  es: "Spanish • Español",
  fr: "French • Français",
  de: "German • Deutsch",
  ko: "Korean • 한국어",
};

const DECKS: Record<string, string> = {
  ja: [
    "Komorebi|木漏れ日|ko·mo·re·bi|Noun|Sunlight filtering through trees|Mori no naka de komorebi wo miageta.|森の中で木漏れ日を見上げた。|I looked up at the sunlight filtering through the trees in the forest.|JLPT N3",
    "Natsukashii|懐かしい|na·tsu·ka·shii|Adj|Dearly missed; nostalgic; fond|Kono kyoku wo kiku to gakusei jidai ga natsukashii.|この曲を聴くと学生時代が懐かしい。|Listening to this song makes me nostalgic for my student days.|JLPT N4",
    "Isshoukenmei|一生懸命|is·shou·ken·mei|Adv|With utmost effort; as hard as one can|Kanojo wa mainichi isshoukenmei nihongo wo benkyou shite iru.|彼女は毎日一生懸命日本語を勉強している。|She studies Japanese as hard as she can every day.|JLPT N4",
    "Rinkiouhen|臨機応変|rin·ki·ou·hen|Noun|Adapting to circumstances; playing it by ear|Joukyou ni awasete rinkiouhen ni taiou shimashou.|状況に合わせて臨機応変に対応しましょう。|Let's respond flexibly according to the situation.|JLPT N2",
    "Ichigo-ichie|一期一会|i·chi·go i·chi·e|Idiom|Once-in-a-lifetime encounter|Tabisaki de no deai wo ichigo-ichie toshite taisetsu ni suru.|旅先での出会いを一期一会として大切にする。|Treasure each encounter on a journey as once in a lifetime.|JLPT N2",
  ].join("\n"),

  es: [
    "Madrugar|Madrugar|ma·dru·gar|Verb|To wake up / get up early|Mañana tengo que madrugar para tomar el tren.|Mañana tengo que madrugar para tomar el tren.|Tomorrow I have to get up early to catch the train.|CEFR B1",
    "Sobremesa|Sobremesa|so·bre·me·sa|Noun|Time spent chatting at the table after a meal|Hicimos una larga sobremesa con café y amigos.|Hicimos una larga sobremesa con café y amigos.|We had a long after-dinner chat over coffee with friends.|CEFR B2",
    "Aprovechar|Aprovechar|a·pro·ve·char|Verb|To make the most of; take advantage of|Vamos a aprovechar el buen tiempo para caminar.|Vamos a aprovechar el buen tiempo para caminar.|Let's make the most of the good weather to go for a walk.|CEFR A2",
    "Desvelarse|Desvelarse|des·ve·lar·se|Verb|To stay awake; be unable to sleep|Me desvelé leyendo un libro muy interesante.|Me desvelé leyendo un libro muy interesante.|I stayed up late reading a very interesting book.|CEFR B2",
    "Cotidiano|Cotidiano|co·ti·dia·no|Adj|Daily; everyday; routine|Aprender palabras nuevas es parte de mi vida cotidiana.|Aprender palabras nuevas es parte de mi vida cotidiana.|Learning new words is part of my everyday life.|CEFR B1",
  ].join("\n"),

  fr: [
    "Dépaysement|Dépaysement|dé·pa·y·se·ment|Noun|Feeling of being in a new/foreign surrounding|Ce voyage au Japon m'a offert un vrai dépaysement.|Ce voyage au Japon m'a offert un vrai dépaysement.|This trip to Japan gave me a true change of scenery.|CEFR B2",
    "Flâner|Flâner|flâ·ner|Verb|To stroll aimlessly and enjoy the surroundings|J'aime flâner dans les petites rues le dimanche.|J'aime flâner dans les petites rues le dimanche.|I love strolling through the narrow streets on Sundays.|CEFR B1",
    "Retrouvailles|Retrouvailles|re·trou·vailles|Noun|Warm reunion after a long separation|Nos retrouvailles à la gare étaient très émouvantes.|Nos retrouvailles à la gare étaient très émouvantes.|Our reunion at the train station was very moving.|CEFR B2",
    "Quotidien|Quotidien|quo·ti·dien|Adj/Noun|Daily; everyday life|Un petit effort quotidien fait une grande différence.|Un petit effort quotidien fait une grande différence.|A small daily effort makes a big difference.|CEFR A2",
    "Épanouir|Épanouir|s'é·pa·nou·ir|Verb|To blossom; thrive; feel fulfilled|Elle s'épanouit pleinement dans son nouveau travail.|Elle s'épanouit pleinement dans son nouveau travail.|She is truly thriving in her new job.|CEFR B2",
  ].join("\n"),

  de: [
    "Fernweh|Fernweh|Fern·weh|Noun|Longing for far-off places; wanderlust|Im Herbst bekomme ich immer großes Fernweh.|Im Herbst bekomme ich immer großes Fernweh.|In autumn I always get a strong longing for distant places.|CEFR B1",
    "Feierabend|Feierabend|Fei·er·abend|Noun|End of the workday; evening free time|Nach der Arbeit genieße ich meinen wohlverdienten Feierabend.|Nach der Arbeit genieße ich meinen wohlverdienten Feierabend.|After work I enjoy my well-deserved evening off.|CEFR A2",
    "Fingerspitzengefühl|Fingerspitzengefühl|Fin·ger·spit·zen·ge·fühl|Noun|Tact; intuitive flair; sensitivity|Für diese Verhandlung braucht man viel Fingerspitzengefühl.|Für diese Verhandlung braucht man viel Fingerspitzengefühl.|You need a lot of tact for this negotiation.|CEFR C1",
    "Gemütlichkeit|Gemütlichkeit|Ge·müt·lich·keit|Noun|Warmth, coziness, and good cheer|Das kleine Café strahlt eine wunderbare Gemütlichkeit aus.|Das kleine Café strahlt eine wunderbare Gemütlichkeit aus.|The small café radiates a wonderful coziness.|CEFR B1",
    "Vorfreude|Vorfreude|Vor·freu·de|Noun|Joyful anticipation|Vorfreude ist bekanntlich die schönste Freude.|Vorfreude ist bekanntlich die schönste Freude.|Joyful anticipation is known to be the best joy.|CEFR B1",
  ].join("\n"),

  ko: [
    "So-hwak-haeng|소확행|so·hwak·haeng|Noun|Small but certain happiness|Ttatteuthan keopi han jani naui sohwakhaeng-ida.|따뜻한 커피 한 잔이 나의 소확행이다.|A warm cup of coffee is my small but certain happiness.|TOPIK B1",
    "Jeong|정 (情)|jeong|Noun|Deep affection, bond, and warmth developed over time|Orae hamkke ilhamyeonseo dongnyodeulgwa jeongi mani deureotda.|오래 함께 일하면서 동료들과 정이 많이 들었다.|Working together for a long time built a deep bond with my colleagues.|TOPIK B2",
    "Nun-chi|눈치|nun·chi|Noun|Subtle art of reading the room / social awareness|Geu sarameun nunchiga ppallaseo bunwigireul jal paakanda.|그 사람은 눈치가 빨라서 분위기를 잘 파악한다.|He is quick-witted and reads the room well.|TOPIK B1",
    "Seol-le-da|설레다|seol·le·da|Verb|To flutter with excitement; feel heart-fluttering anticipation|Saeroun yeohaengeul tteonagi jeonnal bameun eonjena seollenda.|새로운 여행을 떠나기 전날 밤은 언제나 설렌다.|The night before leaving on a new trip always makes my heart flutter.|TOPIK A2",
    "Kku-jun-hi|꾸준히|kku·jun·hi|Adv|Steadily; consistently; untiringly|Maeil kkujunhi daneoreul oeumyeon sillyeogi neunda.|매일 꾸준히 단어를 외우면 실력이 는다.|If you memorize words steadily every day, your skills will improve.|TOPIK A2",
  ].join("\n"),
};

export function getDeckCount(lang: string): number {
  const raw = DECKS[lang] || DECKS.ja;
  let count = 1;
  for (let i = 0; i < raw.length; i++) {
    if (raw.charCodeAt(i) === 10) count++;
  }
  return count;
}

export function getCard(
  lang: string,
  rawIndex: number,
  useNativeCjk?: boolean
): VocabCard {
  const key = DECKS[lang] ? lang : "ja";
  const lines = DECKS[key].split("\n");
  const total = lines.length;
  const idx = ((rawIndex % total) + total) % total;
  const parts = lines[idx].split("|");

  const wordLatin = parts[0] || "";
  const wordNative = parts[1] || wordLatin;
  const reading = parts[2] || "";
  const pos = parts[3] || "";
  const meaning = parts[4] || "";
  const exampleLatin = parts[5] || "";
  const exampleNative = parts[6] || exampleLatin;
  const translation = parts[7] || "";
  const level = parts[8] || "";

  const isCjk = key === "ja" || key === "ko";
  const showNative = Boolean(useNativeCjk) && isCjk;

  return {
    word: showNative ? wordNative : wordLatin,
    reading: showNative && wordLatin !== wordNative ? `${reading} (${wordLatin})` : reading,
    pos,
    meaning,
    example: showNative ? exampleNative : exampleLatin,
    translation,
    level,
    index: idx,
    total,
    languageLabel: showNative
      ? LANGUAGE_LABELS_NATIVE[key] || LANGUAGE_LABELS_LATIN.ja
      : LANGUAGE_LABELS_LATIN[key] || LANGUAGE_LABELS_LATIN.ja,
  };
}
