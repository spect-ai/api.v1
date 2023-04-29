export function isValidDateString(dateString?: string): boolean {
  // const [year, month, day] = dateString.split('-').map(Number);
  // const date = new Date(year, month - 1, day);
  // return (
  //   date.getFullYear() === year &&
  //   date.getMonth() === month - 1 &&
  //   date.getDate() === day
  // );

  return !!Date.parse(dateString);
}
