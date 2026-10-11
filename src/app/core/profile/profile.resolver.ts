import { ResolveFn, Router } from '@angular/router';
import { UserProfileService } from '../userProfiles/userProfile.service';
import { ProfileStore } from '../userProfiles/profile.store';
import { AuthStore } from '../auth/auth.store';
import { inject } from '@angular/core';

const resolutions = new WeakMap<ProfileStore, number>();

export const profileResolver: ResolveFn<string> = async (route, state) => {
  const router = inject(Router);

  const profileService = inject(UserProfileService);

  const authStore = inject(AuthStore);
  const profileStore = inject(ProfileStore);

  const gamertag = route.paramMap.get('gamertag')!;

  const resolution = (resolutions.get(profileStore) ?? 0) + 1;
  resolutions.set(profileStore, resolution);
  profileStore.set(null);

  try {
    const myProfile = authStore.profile();

    if (myProfile?.gamertag === gamertag) {
      profileStore.set(myProfile);
    }

    const profile = await profileService.getProfileByGamertag(gamertag);

    if (resolution !== resolutions.get(profileStore)) return gamertag;

    if (!profile) {
      router.navigate(['/404']);
    }

    profileStore.set(profile);
  } catch (e) {
    if (resolution !== resolutions.get(profileStore)) return gamertag;
    profileStore.set(null);
    router.navigate(['/404']);
  }

  return gamertag;
};
