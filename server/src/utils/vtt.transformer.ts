type TimestampItem = string;

function parseTimestampLine(line: string) {
  const match = line.trim().match(/^\[(\d[:.]+)\]\s+(.+)$/);

  if (!match) {
    throw new Error(`Invalid timestamp format: ${line}`);
  }

  const rawTime = match[1].replace(".", ":");
  const title = match[2].trim();

  const parts = rawTime.split(":").map(Number);

  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (parts.length === 2) {
    [minutes, seconds] = parts;
  } else if (parts.length === 3) {
    [hours, minutes, seconds] = parts;
  }

  return {
    seconds: hours * 3600 + minutes * 60 + seconds,
    title,
  };
}

function formatVttTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return (
    [
      String(hours).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(seconds).padStart(2, "0"),
    ].join(":") + ".000"
  );
}

export function timestampsToChaptersVtt(
  timestamps: TimestampItem[],
  videoDurationSeconds: number,
) {
  const chapters = timestamps.map(parseTimestampLine);

  const cues = chapters.map((chapter, index) => {
    const next = chapters[index + 1];

    const start = chapter.seconds;
    const end = next?.seconds ?? videoDurationSeconds;

    return `${formatVttTime(start)} --> ${formatVttTime(end)}\n${chapter.title}`;
  });

  return `WEBVTT\n\n${cues.join("\n\n")}`;
}
