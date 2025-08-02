"use server";

import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

const userProfileSchema = z.object({
  user_id: z.string(),
  photo: z.string().optional(),
  phone: z.string().optional(),
  name: z.string().min(1, "Le prénom est requis"),
  family_name: z.string().min(1, "Le nom de famille est requis"),
  role: z.enum(["user", "admin"]).default("user"),
  address: z.string().optional(),
  billing_info: z.string().min(1, "La facture est obligatoire"),
});

export type UserProfileData = z.infer<typeof userProfileSchema>;

export async function uploadBillingFile(user_id: string, file: File) {
  const supabase = createClient();
  const fileName = `${user_id}/${Date.now()}_${file.name}`;

  const { error: storageError } = await (await supabase).storage
    .from("factures")
    .upload(fileName, file);

  if (storageError) throw storageError;

  const file_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/factures/${fileName}`;
  return file_url;
}

export async function createUserProfile(profileData: UserProfileData) {
  const supabase = createClient();

  const validatedData = userProfileSchema.parse(profileData);

  const { data, error } = await (await supabase)
    .from("UserProfiles")
    .insert([validatedData])
    .select();

  if (error) throw error;
  return data;
}

export async function getUserProfile(user_id: string) {
  const supabase = createClient();

  const { data, error } = await (await supabase)
    .from("UserProfiles")
    .select("*")
    .eq("user_id", user_id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserProfile(
  user_id: string,
  profileData: Partial<UserProfileData>,
) {
  const supabase = createClient();

  const { data, error } = await (await supabase)
    .from("UserProfiles")
    .update(profileData)
    .eq("user_id", user_id)
    .select();

  if (error) throw error;
  return data;
}

export async function getAllUserProfiles() {
  const supabase = createClient();

  const { data, error } = await (
    await supabase
  )
    .from("UserProfiles")
    .select(
      `
      *,
      auth_users:user_id (
        id,
        email,
        created_at
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function promoteToAdmin(user_id: string) {
  const supabase = createClient();

  await ensureUserProfile(user_id);

  const { data, error } = await (await supabase)
    .from("UserProfiles")
    .update({ role: "admin" })
    .eq("user_id", user_id)
    .select();

  if (error) throw error;
  return data;
}

export async function checkAdminStatus(user_id: string) {
  const supabase = createClient();

  const { data, error } = await (await supabase)
    .from("UserProfiles")
    .select("role")
    .eq("user_id", user_id)
    .maybeSingle();

  if (error) {
    console.error("Error checking admin status:", error);
    return false;
  }

  if (!data) {
    return false;
  }

  return data.role === "admin";
}

export async function ensureUserProfile(user_id: string) {
  const supabase = createClient();

  const { data: existingProfile, error: checkError } = await (await supabase)
    .from("UserProfiles")
    .select("id")
    .eq("user_id", user_id)
    .maybeSingle();

  if (checkError) {
    console.error("Error checking user profile:", checkError);
    throw checkError;
  }

  if (!existingProfile) {
    const { data: newProfile, error: createError } = await (
      await supabase
    )
      .from("UserProfiles")
      .insert([
        {
          user_id,
          name: "Utilisateur",
          family_name: "Anonyme",
          role: "user",
          billing_info: "Aucun fichier fourni",
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error("Error creating user profile:", createError);
      throw createError;
    }

    return newProfile;
  }

  return existingProfile;
}
