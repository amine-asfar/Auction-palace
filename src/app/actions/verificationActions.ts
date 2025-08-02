"use server";
import { createClient } from "@/utils/supabase/server";

export async function uploadVerificationFile(user_id: string, file: File) {
  const supabase = createClient();

  try {
    const { data: existingVerification } = await (await supabase)
      .from("identityverifications")
      .select("id, status")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      existingVerification &&
      (existingVerification.status === "pending" ||
        existingVerification.status === "approved")
    ) {
      throw new Error("Vous avez déjà soumis un document de vérification");
    }

    const fileName = `${user_id}/${Date.now()}_${file.name}`;
    const { error: storageError } = await (await supabase).storage
      .from("verifications")
      .upload(fileName, file);

    if (storageError) {
      console.error("Storage error:", storageError);
      throw new Error("Erreur lors du téléchargement du fichier");
    }

    const { data: urlData } = (await supabase).storage
      .from("verifications")
      .getPublicUrl(fileName);

    const file_url = urlData.publicUrl;

    const { data, error } = await (
      await supabase
    )
      .from("identityverifications")
      .insert([
        {
          user_id,
          type: "id",
          file_url,
          status: "pending",
        },
      ])
      .select();

    if (error) {
      console.error("Database error:", error);

      try {
        await (await supabase).storage.from("verifications").remove([fileName]);
      } catch (deleteError) {
        console.error("Failed to delete uploaded file:", deleteError);
      }
      throw new Error("Erreur lors de l'enregistrement de la vérification");
    }

    return data;
  } catch (error) {
    console.error("Upload verification error:", error);
    throw error;
  }
}

export async function getVerificationStatus(user_id: string) {
  const supabase = createClient();
  const { data, error } = await (await supabase)
    .from("identityverifications")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  return data ? data[0] : null;
}

export async function GetAllUsersVerifications() {
  const supabase = createClient();
  const { data, error } = await (await supabase)
    .from("identityverifications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function deleteVerificationFile(file_url: string) {
  const supabase = createClient();

  const urlParts = file_url.split("/storage/v1/object/public/verifications/");
  if (urlParts.length !== 2) {
    throw new Error("Invalid file URL format");
  }

  const filePath = urlParts[1];

  const { error } = await (await supabase).storage
    .from("verifications")
    .remove([filePath]);

  if (error) throw error;
  return true;
}

export async function SetUserVerification(
  verification_id: string,
  status: "approved" | "rejected" | "pending",
) {
  const supabase = createClient();

  const { data: verification, error: fetchError } = await (await supabase)
    .from("identityverifications")
    .select("file_url")
    .eq("id", verification_id)
    .single();

  if (fetchError) throw fetchError;

  const { data, error } = await (
    await supabase
  )
    .from("identityverifications")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", verification_id)
    .select();

  if (error) throw error;

  if (status === "approved" || status === "rejected") {
    try {
      await deleteVerificationFile(verification.file_url);
      console.log(
        `Verification file deleted for verification ID: ${verification_id}`,
      );
    } catch (deleteError) {
      console.error(`Failed to delete verification file: ${deleteError}`);
    }
  }

  return data;
}

export async function testVerificationTable() {
  const supabase = createClient();
  const { data, error } = await (await supabase)
    .from("identityverifications")
    .select("*")
    .limit(1);
  if (error) {
    console.error("Table test error:", error);
    throw error;
  }
  return { exists: true, data };
}
