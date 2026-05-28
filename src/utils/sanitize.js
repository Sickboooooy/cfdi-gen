const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi,
  /system\s*:/gi,
  /assistant\s*:/gi,
  /human\s*:/gi,
  /\[INST\]/gi,
  /<<SYS>>/gi,
  /<\|im_start\|>/gi,
  /###\s*(instruction|system|prompt)/gi,
  /you\s+are\s+now\s+(?:a|an)\s+/gi,
  /forget\s+(everything|all|your)/gi,
  /new\s+personality/gi,
  /jailbreak/gi,
  /DAN\s+mode/gi,
];

export function sanitizeUserInput(text, maxLength = 500) {
  if (!text || typeof text !== "string") return "";

  let clean = text.slice(0, maxLength);

  for (const pattern of INJECTION_PATTERNS) {
    clean = clean.replace(pattern, "[FILTRADO]");
  }

  clean = clean.replace(/\n{3,}/g, "\n\n");

  return clean.trim();
}
