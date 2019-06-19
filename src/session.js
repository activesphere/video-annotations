/* Browser session storage */

export const set = (key, val) => {
  document.cookie = `${key}=${val}`;
};

export const get = key => {
  const items = document.cookie.split(';').map(s => s.split('='));

  const [_, val] = items.find(([k, v]) => k === key) || [];

  return val;
};
