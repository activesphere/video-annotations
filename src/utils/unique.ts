export default (arr: Array<string>) => {
    const u: { [index: string]: number } = {};
  const a = [];

  for (const v of arr) {
    if (!u.hasOwnProperty(v)) {
      a.push(v);
      u[v] = 1;
    }
  }

  return a;
};
