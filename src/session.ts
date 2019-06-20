/* Browser session storage */

export const set = (key: string, val: string) => {
  document.cookie = `${key}=${val}`;
};

export const get = (key: string) => {
  const items = document.cookie.split(';').map(s => s.split('='));

  const item = items.find(([k]) => k === key);

  if (!item) return void 0;

  return item[1];
};
