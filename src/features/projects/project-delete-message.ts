const LINKED_DETAIL_PATTERN = /It is still linked to (.+?)\. Use safe force delete/i;

export function projectDeleteLinkedMessage(message: string) {
  const match = message.match(LINKED_DETAIL_PATTERN);
  if (!match?.[1]) return "Linked records found. Detach links, then delete project only.";
  return "Linked: " + match[1] + ".";
}
