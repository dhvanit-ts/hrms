function formatTimeInFullWords(milliseconds: number): string {
  // Handle invalid or negative input
  if (milliseconds < 0 || isNaN(milliseconds)) {
    return "Invalid time";
  }

  // Calculate components
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Build the parts array for flexible formatting
  const parts = [];
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
  if (seconds > 0 || parts.length === 0)
    parts.push(`${seconds} second${seconds !== 1 ? "s" : ""}`);

  // Join parts with commas and handle the last part with "and" if needed
  if (parts.length > 1) {
    return parts.slice(0, -1).join(", ") + " and " + parts.slice(-1);
  }
  return parts[0];
}

function formatTimeInShortWords(milliseconds: number): string {
  // Handle invalid or negative input
  if (milliseconds < 0 || isNaN(milliseconds)) {
    return "Invalid";
  }

  // Calculate components
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Build the formatted string
  let result = "";
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0 || hours > 0) result += `${minutes}m `; // Include minutes if hours exist, even if 0
  result += `${seconds}s`;

  return result.trim(); // Remove trailing space if any
}

function getDateAndDay(timestamp: number) {
  if (!timestamp || isNaN(timestamp)) {
    return "Invalid timestamp";
  }
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

export { formatTimeInFullWords, formatTimeInShortWords, getDateAndDay };
