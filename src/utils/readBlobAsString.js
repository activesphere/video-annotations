async function readBlobAsString(blob) {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(this);
    reader.readAsText(blob);
  });
}

export default readBlobAsString;
