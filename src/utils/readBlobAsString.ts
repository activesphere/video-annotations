async function readBlobAsString(blob: Blob): Promise<string | null> {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else resolve(null);
    };
    reader.onerror = () => reject(new Error('Error reading Blob'));
    reader.readAsText(blob);
  });
}

export default readBlobAsString;
