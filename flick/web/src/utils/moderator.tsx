const bannedWords = [
  "nigger", "n1gger", "n!gger", "n*gger", "nigg3r",
  "bitch", "bitchface",
  "n i g g e r",
  "faggot", "f*ggot", "fagg0t", "f@g", "f4ggot", "faggit",
  "kike", "k1ke", "k!ke", "kill",
  "chink", "ch!nk", "ch1nk", "ch0nk",
  "spic", "sp!c", "spicface", "spicola", "sp!cola",
  "pedophile", "ped0", "p3d0phile", "p3do",
  "rape", "rapist", "r@pist", "rap3st", "rapistt",
  "beastiality", "be@stiality", "b3astiality", "bestiality",
  "cunt", "c*nt", "c u n t", "cu*t", "cuntface", "cuntbag",
  "whore", "w*ore", "whor3", "w h o r e",
  "motherfucker", "motherf*cker", "m0therfucker", "motha f*cka",
  "fistfuck", "fist f*ck", "fistf*ck", "f1stf*ck",
];

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildRegex(words: string[]): RegExp {
  const patterns = words.map(word => escapeRegex(word).replace(/\\\*/g, '.').replace(/\\\s/g, '\\s*'));
  return new RegExp(`(${patterns.join('|')})`, 'gi');
}

export const validatePost = (text: string) => {
  const regex = buildRegex(bannedWords);
  const matches = [...text.matchAll(regex)].map(m => m[0]);

  if (matches.length > 0) {
    return {
      allowed: false,
      reason: `contains banned word(s): ${matches.join(", ")}`,
    };
  }
  return { allowed: true };
};

export const highlightBannedWords = (text: string) => {
  const regex = buildRegex(bannedWords);

  const parts = [];
  let lastIndex = 0;

  const matches = text.matchAll(regex);

  for (const match of matches) {
    if (!match.index && match.index !== 0) continue;
    const start = match.index;
    const end = start + match[0].length;

    if (start > lastIndex) {
      parts.push(<span key={lastIndex}>{text.slice(lastIndex, start)}</span>);
    }

    parts.push(
      <span key={start} className="text-red-600 font-bold">
        {text.slice(start, end)}
      </span>
    );

    lastIndex = end;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={lastIndex}>{text.slice(lastIndex)}</span>);
  }

  return <p>{parts}</p>;
};

