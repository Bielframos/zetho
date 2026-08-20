
import { environment } from '../../../environments/environment';
import { appwrite } from '../../shared/infra/appwrite/appwrite.client';

export function getThemeMediaUrl(imageId: string) {
  return appwrite.storage.getFilePreview({
    bucketId: environment.themesBucketId,
    fileId: imageId,
  });
}
