export default arr => {
  const u = {};
  const a = [];

  for (const v of arr) {
    if (!u.hasOwnProperty(v)) {
      a.push(v);
      u[v] = 1;
    }
  }

  return a;
};
