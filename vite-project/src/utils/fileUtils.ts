export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Compress the image before returning if needed, or simply return the base64
      // To keep it simple and reliable for MongoDB, we return the raw Data URL string
      resolve(reader.result as string);
    };
    reader.onerror = (error) => reject(error);
  });
};
