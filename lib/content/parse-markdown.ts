import type { Question } from "@/lib/domain";

type Frontmatter = Partial<{
  id: string;
  title: string;
  type: string;
  direction: string;
  difficulty: string;
  tags: string[];
  answer: string;
  explanation: string;
  choices: Array<{ id: string; text: string; correct: boolean }>;
  companies: string[];
  interviewYear: number;
  interviewRound: string;
  source: string;
  isPremium: boolean;
}>;

const VALID_TYPES = ["concept", "choice", "code-reading"] as const;
const VALID_DIFFICULTIES = ["easy", "medium", "hard"] as const;
const VALID_ROUNDS = ["笔试", "一面", "二面", "三面", "终面"];

function parseFrontmatter(content: string): {
  frontmatter: Frontmatter;
  body: string;
} {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error("No frontmatter found. Expected --- YAML frontmatter --- body");
  }

  const frontmatterStr = match[1];
  const body = (match[2] ?? "").trim();

  const frontmatter: Frontmatter = {};

  const lines = frontmatterStr.split(/\r?\n/);
  let inTags = false;
  let inChoices = false;
  let currentChoice: Partial<Frontmatter["choices"]> = [];
  let tags: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    // Multi-line arrays: tags and choices
    if (line.startsWith("tags:")) {
      inTags = true;
      inChoices = false;
      const inlineVal = line.slice(5).trim();
      if (inlineVal.startsWith("[") && inlineVal.endsWith("]")) {
        try {
          tags = parseYamlArray(inlineVal);
        } catch {
          tags = [];
        }
        frontmatter.tags = tags;
        inTags = false;
      }
      continue;
    }

    if (inTags) {
      if (line.startsWith("-")) {
        const val = line.replace(/^- /, "").trim();
        if (val) {
          if (val.startsWith("[") && val.endsWith("]")) {
            try {
              tags = tags.concat(parseYamlArray(val));
            } catch {
              // skip
            }
          } else {
            const cleaned = val.replace(/^["']|["']$/g, "");
            tags.push(cleaned);
          }
        }
        continue;
      } else {
        inTags = false;
        frontmatter.tags = tags;
        // Fall through to process this line as a regular key:value
      }
    }

    if (line.startsWith("choices:")) {
      inChoices = true;
      inTags = false;
      if (line.slice(8).trim()) {
        // Inline choices array
        const choicesStr = line.slice(8).trim();
        try {
          const parsed = JSON.parse(choicesStr);
          if (Array.isArray(parsed)) {
            frontmatter.choices = parsed;
          }
        } catch {
          // will parse below
          currentChoice = [];
        }
      }
      continue;
    }

    if (inChoices) {
      if (line.startsWith("-")) {
        const val = line.replace(/^- /, "").trim();
        if (val) {
          try {
            const choice = JSON.parse(val);
            if (choice.id && choice.text !== undefined) {
              currentChoice.push({
                id: String(choice.id),
                text: String(choice.text),
                correct: Boolean(choice.correct),
              });
            }
          } catch {
            // skip malformed
          }
        }
        continue;
      } else {
        inChoices = false;
        if (currentChoice.length > 0) {
          frontmatter.choices = currentChoice as Frontmatter["choices"];
        }
        // Fall through to process this line as a regular key:value
      }
    }

    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    const rawVal = line.slice(colonIdx + 1).trim();

    switch (key) {
      case "id":
      case "title":
      case "type":
      case "direction":
      case "difficulty":
      case "answer":
      case "explanation":
      case "source":
      case "interviewRound":
        frontmatter[key] = rawVal.replace(/^["']|["']$/g, "");
        break;
      case "companies":
        try {
          frontmatter.companies = parseYamlArray(rawVal);
        } catch {
          frontmatter.companies = [];
        }
        break;
      case "interviewYear":
        frontmatter.interviewYear = parseInt(rawVal, 10) || undefined;
        break;
      case "isPremium":
        frontmatter.isPremium = rawVal === "true";
        break;
      default:
        break;
    }
  }

  if (inTags) {
    frontmatter.tags = tags;
  }
  if (inChoices && currentChoice.length > 0) {
    frontmatter.choices = currentChoice as Frontmatter["choices"];
  }

  return { frontmatter, body };
}

function parseYamlArray(val: string): string[] {
  const arrStr = val.replace(/^\[|\]$/g, "");
  if (!arrStr.trim()) return [];
  return arrStr.split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
}

export function parseMarkdownQuestion(content: string): Question {
  const { frontmatter, body } = parseFrontmatter(content);

  if (!frontmatter.id) throw new Error("Missing required field: id");
  if (!frontmatter.title) throw new Error("Missing required field: title");
  if (!frontmatter.type) throw new Error("Missing required field: type");
  if (!frontmatter.direction) throw new Error("Missing required field: direction");
  if (!frontmatter.difficulty) throw new Error("Missing required field: difficulty");
  if (!frontmatter.answer) throw new Error("Missing required field: answer");

  if (!VALID_TYPES.includes(frontmatter.type as typeof VALID_TYPES[number])) {
    throw new Error(`Invalid type: ${frontmatter.type}. Must be one of ${VALID_TYPES.join(", ")}`);
  }
  if (!VALID_DIFFICULTIES.includes(frontmatter.difficulty as typeof VALID_DIFFICULTIES[number])) {
    throw new Error(`Invalid difficulty: ${frontmatter.difficulty}. Must be one of ${VALID_DIFFICULTIES.join(", ")}`);
  }
  if (frontmatter.interviewRound && !VALID_ROUNDS.includes(frontmatter.interviewRound)) {
    throw new Error(`Invalid interviewRound: ${frontmatter.interviewRound}. Must be one of ${VALID_ROUNDS.join(", ")}`);
  }

  return {
    id: frontmatter.id,
    title: frontmatter.title,
    body,
    type: frontmatter.type as Question["type"],
    direction: frontmatter.direction,
    difficulty: frontmatter.difficulty as Question["difficulty"],
    tags: frontmatter.tags ?? [],
    answer: frontmatter.answer,
    explanation: frontmatter.explanation ?? null,
    choices: frontmatter.choices ?? null,
    companies: frontmatter.companies ?? [],
    interviewYear: frontmatter.interviewYear ?? null,
    interviewRound: (frontmatter.interviewRound as Question["interviewRound"]) ?? null,
    source: frontmatter.source ?? null,
    isPremium: frontmatter.isPremium ?? false,
  };
}
