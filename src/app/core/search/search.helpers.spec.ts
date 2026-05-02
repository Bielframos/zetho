import { normalize, extractKeywords } from './search.helpers';

describe('search helpers', () => {
  describe('normalize', () => {
    it('should convert text to lowercase', () => {
      expect(normalize('Fortnite')).toBe('fortnite');
      expect(normalize('Arc Raiders')).toBe('arc raiders');
      expect(normalize('FLINTHOOK')).toBe('flinthook');
    });

    it('should remove diacritics/accents', () => {
      expect(normalize('São Paulo')).toBe('sao paulo');
      expect(normalize('Pokémon')).toBe('pokemon');
      expect(normalize('Ação')).toBe('acao');
    });

    it('should trim leading and trailing whitespace', () => {
      expect(normalize('  fortnite  ')).toBe('fortnite');
      expect(normalize('\t arc \n')).toBe('arc');
    });

    it('should handle empty string', () => {
      expect(normalize('')).toBe('');
    });

    it('should preserve hyphens and underscores', () => {
      expect(normalize('arc-raiders')).toBe('arc-raiders');
      expect(normalize('arc_raiders')).toBe('arc_raiders');
    });
  });

  describe('extractKeywords', () => {
    it('should split query into keywords by whitespace', () => {
      expect(extractKeywords('arc raiders')).toEqual(['arc', 'raiders']);
    });

    it('should replace hyphens with spaces and split', () => {
      expect(extractKeywords('arc-raiders')).toEqual(['arc', 'raiders']);
    });

    it('should replace underscores with spaces and split', () => {
      expect(extractKeywords('arc_raiders')).toEqual(['arc', 'raiders']);
    });

    it('should normalize and split combined text', () => {
      expect(extractKeywords('Fort  Night')).toEqual(['fort', 'night']);
    });

    it('should filter out empty tokens', () => {
      expect(extractKeywords('  ')).toEqual([]);
      expect(extractKeywords('')).toEqual([]);
    });

    it('should handle single-word queries', () => {
      expect(extractKeywords('flinthook')).toEqual(['flinthook']);
      expect(extractKeywords('Flinthook')).toEqual(['flinthook']);
    });

    it('should remove accents before splitting', () => {
      expect(extractKeywords('Ação Jogo')).toEqual(['acao', 'jogo']);
    });
  });
});
