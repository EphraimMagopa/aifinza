import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

import { ProfileForm } from "./profile-form";

export async function ProfileContent() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/signin");
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold tracking-tight">Profile</h2>
				<p className="text-muted-foreground">Manage your account settings</p>
			</div>
			<ProfileForm user={user} />
		</div>
	);
}
