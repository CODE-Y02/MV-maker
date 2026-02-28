import { get, set, del, keys } from 'idb-keyval';

/**
 * Storage utility for handling large binary files (Blobs/Files) in IndexedDB.
 * This avoids keeping massive amounts of data in RAM (Zustand).
 */
export const ProjectStorage = {
    /**
     * Saves a file to IndexedDB.
     */
    async saveAsset(id: string, data: Blob | File): Promise<void> {
        await set(`asset_${id}`, data);
    },

    /**
     * Retrieves a file from IndexedDB.
     */
    async getAsset(id: string): Promise<Blob | File | undefined> {
        return await get(`asset_${id}`);
    },

    /**
     * Deletes a file from IndexedDB.
     */
    async deleteAsset(id: string): Promise<void> {
        await del(`asset_${id}`);
    },

    /**
     * Clears all assets for the current project.
     */
    async clearAllAssets(): Promise<void> {
        const allKeys = await keys();
        for (const key of allKeys) {
            if (typeof key === 'string' && key.startsWith('asset_')) {
                await del(key);
            }
        }
    }
};
