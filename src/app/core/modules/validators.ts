import { AbstractControl, ValidatorFn } from "@angular/forms";
import { catchError, distinctUntilChanged, map, of, switchMap } from "rxjs";
import { UserProfileService } from "../zerei/userProfile.service";
import { inject } from "@angular/core";

export function nameValidator(control: AbstractControl) {
    const value = control.value as string;
    if (!value) return null;
    const regex = /^[A-Za-zÀ-ÿ]+(?: [A-Za-zÀ-ÿ]+)*$/;
    return regex.test(value) ? null : { invalidName: true };
}

export function gamertagFormatValidator(control: AbstractControl) {
    const value = control.value as string;
    if (!value) return null;
    const regex = /^[a-zA-Z0-9_]+$/;
    return regex.test(value) ? null : { invalidGamertagFormat: true };
}

export function gamertagAsyncValidator(profileService: UserProfileService) {
    return (control: AbstractControl) => of(control.value).pipe(
        distinctUntilChanged(),
        switchMap(value => value ? profileService.isValidGamertag(control.value) : of(false)),
        map(isValid => (isValid ? null : { gamertagTaken: true })),
        catchError(() => of({ gamertagCheckFailed: true }))
    )
}

export function changedValidator(originalValue?: string) {
    return (control: AbstractControl) => {
        const current = control.value
        return current !== originalValue ? null : { notChanged: true }
    }
}