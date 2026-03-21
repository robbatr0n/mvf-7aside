export function getAvatarColor(name: string): string {
  const colors = [
    "bg-blue-900 text-blue-300",
    "bg-purple-900 text-purple-300",
    "bg-green-900 text-green-300",
    "bg-amber-900 text-amber-300",
    "bg-rose-900 text-rose-300",
    "bg-teal-900 text-teal-300",
    "bg-orange-900 text-orange-300",
    "bg-indigo-900 text-indigo-300",
  ];
  const index =
    name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colors.length;
  return colors[index];
}
