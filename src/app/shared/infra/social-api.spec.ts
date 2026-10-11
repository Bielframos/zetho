import { SocialApi } from './social-api';
import { appwrite } from './appwrite/appwrite.client';
describe('SocialApi guarded mutation', () => {
  it('does not send a mutation if the account changed while JWT was being created', async () => {
    let resolve!: (value: any) => void;
    spyOn(appwrite.account, 'createJWT').and.returnValue(new Promise(done => resolve = done));
    const request = spyOn(globalThis, 'fetch');
    let current = true;
    const pending = new SocialApi().request('social/connections', 'POST', { targetProfileId: 'peer' }, () => current);
    current = false; resolve({ jwt: 'old-or-new-jwt' });
    await expectAsync(pending).toBeRejectedWithError('Sessão alterada.'); expect(request).not.toHaveBeenCalled();
  });
});
