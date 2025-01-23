import path from "path"

const getContentType = (filePath: string) => {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes : Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.csv': 'text/csv',
        '.json': 'application/json',
        '.zip': 'application/zip',
        '.tar': 'application/x-tar',
        '.gz': 'application/gzip',
        // Add more file types as needed
    };
    return contentTypes[ext] || 'application/octet-stream'; // Default to binary if unknown
};

export default getContentType;
