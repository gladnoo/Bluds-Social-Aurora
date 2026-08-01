// Redimensiona e comprime uma imagem no navegador antes de enviar, usando canvas.
// Evita mandar fotos de celular gigantes (8-12MB) que deixam tudo mais lento
// pra carregar depois (e usam menos espaço no Supabase Storage).
export async function compressImage(file, maxDimension = 1600, quality = 0.82) {
  if (!file.type.startsWith("image/")) return file;

  try {
    const img = await loadImage(file);
    let { width, height } = img;

    if (width > maxDimension || height > maxDimension) {
      const scale = maxDimension / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(img, 0, 0, width, height);

    return await new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file); // não comprimiu de verdade (imagem já pequena) — mantém original
          } else {
            resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
          }
        },
        "image/jpeg",
        quality
      );
    });
  } catch {
    return file; // se algo falhar, sobe a imagem original mesmo
  }
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}
