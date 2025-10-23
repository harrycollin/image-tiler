import React from "react";

interface FileUploadProps {
  selectedFile: File | null;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  selectedFile,
  onFileSelect,
}) => {
  return (
    <div className="border rounded-lg p-3">
      <h3 className="text-sm font-semibold mb-2 text-gray-700">Upload Image</h3>
      <input
        type="file"
        accept="image/*"
        onChange={onFileSelect}
        className="block w-full text-sm text-gray-800 file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
      />
      {selectedFile && (
        <p className="text-xs text-gray-600 mt-1 truncate">
          {selectedFile.name}
        </p>
      )}
    </div>
  );
};
