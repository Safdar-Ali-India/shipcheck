export function ArticleByline({
  date,
  minutes,
}: {
  date: string;
  minutes?: number;
}) {
  return (
    <p className="text-sm text-zinc-500">
      {date}
      {minutes ? <span> · {minutes} min read</span> : null}
    </p>
  );
}
