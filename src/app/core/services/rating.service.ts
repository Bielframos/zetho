import { Injectable } from '@angular/core';
import { GameRow, UserProfileRow } from '../types';

const RATINGS_TABLE_ID = 'ratings'

@Injectable({ providedIn: 'root' })
export class RatingService {
    constructor() { }

    async createReview(params: {
        game: GameRow;
        profile: UserProfileRow;
        rating: number;
        review?: string;
    }) {
        try {
        } catch (e) {
            console.error(e)
        }
    }
}
