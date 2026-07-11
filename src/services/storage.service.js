import ImageKit from "@imagekit/nodejs";
import config from "../config/config.js";

const ImageKiteClient = new ImageKit({
  privateKey: config.IMAGEKIT_PRIVATE_KEY,
});

// upload data to storage service
async function uploadFile(file) {
  const result = await ImageKiteClient.files.upload({
    file,
    fileName: "product_" + Date.now(),
    folder: "ecommerce-clone/ecom",
  });

  return result;
}

// delete data from storage service
async function deleteFile(fileId) {
  return await ImageKiteClient.files.delete(fileId);
}

export { uploadFile, deleteFile };
