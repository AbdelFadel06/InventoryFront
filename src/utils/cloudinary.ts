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
    // Détail technique pour le développeur (console), message simple pour l'utilisateur.
    console.warn("Cloudinary : VITE_CLOUDINARY_CLOUD_NAME ou VITE_CLOUDINARY_UPLOAD_PRESET manquant.");
    throw new Error("Veuillez configurer votre environnement Cloudinary.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  let res: Response;
  try {
    res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );
  } catch {
    throw new Error("Envoi de la photo impossible : vérifiez votre connexion internet.");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.warn("Cloudinary :", err?.error?.message ?? res.status);
    throw new Error("L'envoi de la photo a échoué. Vérifiez le fichier (image, taille) et réessayez.");
  }

  const data = await res.json();
  return {
    url:       data.secure_url,
    public_id: data.public_id,
    width:     data.width,
    height:    data.height,
  };
}
