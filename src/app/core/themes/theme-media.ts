
import { environment } from '../../../environments/environment';
import { appwrite } from '../appwrite/appwrite.client';

export function getThemeMediaUrl(imageId: string) {
  return appwrite.storage.getFilePreview({
    bucketId: environment.themesBucketId,
    fileId: imageId,
  });
}
