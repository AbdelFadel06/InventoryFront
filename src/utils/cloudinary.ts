// src/utils/cloudinary.ts
// Upload direct vers Cloudinary depuis le navigateur (unsigned upload)
// Variables à définir dans .env :
//   VITE_CLOUDINARY_CLOUD_NAME=votre_cloud_name
//   VITE_CLOUDINARY_UPLOAD_PRESET=votre_upload_preset

const CLOUD_NAME   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME   as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

export interface CloudinaryResult {
  url: string;
  public_id: string;
  width: number;
  height: number;
}

/**
 * Upload un fichier image vers Cloudinary et retourne l'URL sécurisée.
 * @param file  Fichier image sélectionné par l'utilisateur
 * @param folder  Dossier Cloudinary optionnel (ex: "products")
 */
export async function uploadToCloudinary(
  file: File,
  folder = "products"
): Promise<CloudinaryResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary non configuré. Ajoutez VITE_CLOUDINARY_CLOUD_NAME et VITE_CLOUDINARY_UPLOAD_PRESET dans votre .env"
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? "Erreur upload Cloudinary");
  }

  const data = await res.json();
  return {
    url:       data.secure_url,
    public_id: data.public_id,
    width:     data.width,
    height:    data.height,
  };
}
