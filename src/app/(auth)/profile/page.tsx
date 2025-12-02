import { Suspense } from "react";

import { ProfileContent } from "./profile-content";

export default function ProfilePage() {
	return (
		<Suspense
			fallback={
				<div className="space-y-6">
					<div>
						<h2 className="text-2xl font-bold tracking-tight">Profile</h2>
						<p className="text-muted-foreground">Loading...</p>
					</div>
				</div>
			}
		>
			<ProfileContent />
		</Suspense>
	);
}
