let lastMessage: Date | undefined;

export function getLastMessage(): Date | undefined {
  return lastMessage;
}

export function setLastMessage(date: Date) {
  lastMessage = date;
}
