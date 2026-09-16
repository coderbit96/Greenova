"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { profileSchema, type ProfileInput } from "@/validators/account";
import { updateProfileAction } from "@/actions/account.actions";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { UserDTO } from "@/types/models";
import type { z } from "zod";

type ProfileFormValues = z.input<typeof profileSchema>;

export default function ProfileForm({ user }: { user: UserDTO }) {
  const router = useRouter();
  const { update } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues, unknown, ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      image: user.image ?? "",
    },
    mode: "onBlur",
  });

  async function onSubmit(values: ProfileInput) {
    setSubmitting(true);
    try {
      const result = await updateProfileAction(values);
      if (!result.ok) {
        if (result.issues) {
          for (const [field, messages] of Object.entries(result.issues)) {
            const message = messages?.[0];
            if (message && field in values) {
              setError(field as keyof ProfileFormValues, { message });
            }
          }
        }
        toast.error(result.error);
        return;
      }

      // The JWT callback reloads the account by immutable user id, so name,
      // image and an updated email appear in the navigation immediately.
      await update();
      toast.success("Your account details have been saved.");
      router.refresh();
    } catch {
      toast.error("Could not update your profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // A credentials account can later be securely linked to Firebase. Its
  // Firebase email is then authoritative too, even though its original
  // provider remains "credentials" so password sign-in continues to work.
  const emailManagedExternally = user.provider !== "credentials" || Boolean(user.firebaseUid);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 sm:grid-cols-2" noValidate>
      <Input
        label="Full name"
        autoComplete="name"
        error={errors.name?.message}
        {...register("name")}
      />
      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        readOnly={emailManagedExternally}
        hint={emailManagedExternally ? "Managed by your sign-in provider." : undefined}
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label="Phone number"
        type="tel"
        autoComplete="tel"
        placeholder="+91 98765 43210"
        hint="Used if we need to contact you about a stay."
        error={errors.phone?.message}
        {...register("phone")}
      />
      <Input
        label="Profile photo URL"
        type="url"
        autoComplete="url"
        placeholder="https://example.com/photo.jpg"
        hint="Use a Cloudinary, Unsplash or Google image URL; leave empty to use your initial."
        error={errors.image?.message}
        {...register("image")}
      />
      <div className="sm:col-span-2 flex justify-end border-t border-border-base pt-5">
        <Button type="submit" loading={submitting} disabled={!isDirty}>
          <Save className="size-4" />
          Save changes
        </Button>
      </div>
    </form>
  );
}
