import ImageKit from "@imagekit/nodejs";
import config from "../config/config.js";

const imageKitClient = new ImageKit({
  privateKey: config.IMAGEKIT_PRIVATE_KEY,
});

// upload data to storage service
async function uploadFile(file) {
  try {
    const result = await imageKitClient.files.upload({
      file,
      fileName: file.originalname || `product_${Date.now()}`,
      folder: "ecommerce-clone/ecom",
    });

    return result;
  } catch (error) {
    throw new Error("Failed to upload file to ImageKit", { cause: error });
  }
}

// delete data from storage service
async function deleteFile(fileId) {
  try {
    return await imageKitClient.files.delete(fileId);
  } catch (error) {
    throw new Error("Failed to delete file from ImageKit", { cause: error });
  }
}

export { uploadFile, deleteFile };
